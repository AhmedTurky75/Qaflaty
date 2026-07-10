using System.Text.Json;
using Microsoft.Extensions.Logging;
using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Ads.Aggregates.ProviderIntegration;
using Qaflaty.Domain.Ads.Aggregates.TrackingEvent;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Ads.Repositories;
using Qaflaty.Domain.Common.Identifiers;
using TrackingEventAggregate = Qaflaty.Domain.Ads.Aggregates.TrackingEvent.TrackingEvent;

namespace Qaflaty.Infrastructure.Services.Ads;

/// <summary>
/// Fans a server-channel event out to every provider the store has enabled for server
/// tracking. Always persists its own changes (<see cref="IUnitOfWork.SaveChangesAsync"/>)
/// because it's invoked from three different contexts — command handlers (already wrapped
/// by <c>UnitOfWorkBehavior</c>, so this is a harmless extra no-op save), domain event
/// handlers, and the background retry worker (neither of which auto-save).
/// </summary>
public sealed class EventDispatcherService : IEventDispatcher
{
    private readonly IProviderIntegrationRepository _integrationRepository;
    private readonly ITrackingEventRepository _trackingEventRepository;
    private readonly ITrackingProviderResolver _resolver;
    private readonly IProviderConfiguration _providerConfiguration;
    private readonly ITrackingLogger _trackingLogger;
    private readonly IEventQueue _eventQueue;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<EventDispatcherService> _logger;

    public EventDispatcherService(
        IProviderIntegrationRepository integrationRepository,
        ITrackingEventRepository trackingEventRepository,
        ITrackingProviderResolver resolver,
        IProviderConfiguration providerConfiguration,
        ITrackingLogger trackingLogger,
        IEventQueue eventQueue,
        IUnitOfWork unitOfWork,
        ILogger<EventDispatcherService> logger)
    {
        _integrationRepository = integrationRepository;
        _trackingEventRepository = trackingEventRepository;
        _resolver = resolver;
        _providerConfiguration = providerConfiguration;
        _trackingLogger = trackingLogger;
        _eventQueue = eventQueue;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task DispatchAsync(TrackingEventPayload payload, CancellationToken ct)
    {
        var existing = await _trackingEventRepository.GetByEventKeyAndChannelAsync(
            payload.StoreId, payload.EventKey, TrackingChannel.Server, ct);
        if (existing != null)
            return; // already dispatched for this logical occurrence — never double-send

        var integrations = await _integrationRepository.GetByStoreIdAsync(payload.StoreId, ct);
        // IsDispatchable (not IsActive) so a provider that previously errored still gets retried
        // rather than silently dropping out of the pipeline after one failure.
        var enabledIntegrations = integrations.Where(i => i.IsDispatchable && i.ServerTrackingEnabled).ToList();

        var createResult = TrackingEventAggregate.Create(
            payload.StoreId,
            payload.EventKey,
            payload.EventType,
            TrackingChannel.Server,
            JsonSerializer.Serialize(payload),
            correlationId: payload.EventKey,
            payload.OrderId,
            payload.CustomerRef);

        if (createResult.IsFailure)
        {
            _logger.LogWarning("Could not create tracking event for {EventType}: {Error}", payload.EventType, createResult.Error.Message);
            return;
        }

        var trackingEvent = createResult.Value;
        var plan = enabledIntegrations.Select(integration => (Log: trackingEvent.QueueDispatch(integration.Provider), Integration: integration)).ToList();

        await _trackingEventRepository.AddAsync(trackingEvent, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        foreach (var (log, integration) in plan)
            await AttemptDispatchAsync(trackingEvent, log, integration, payload, ct);

        await _unitOfWork.SaveChangesAsync(ct);
    }

    public async Task RedispatchAsync(TrackingEventId trackingEventId, Guid dispatchLogId, CancellationToken ct)
    {
        var trackingEvent = await _trackingEventRepository.GetByIdAsync(trackingEventId, ct);
        var log = trackingEvent?.DispatchLogs.FirstOrDefault(l => l.Id == dispatchLogId);
        if (trackingEvent == null || log == null)
            return;

        var integration = await _integrationRepository.GetByStoreAndProviderAsync(trackingEvent.StoreId, log.Provider, ct);
        if (integration == null)
            return;

        var payload = JsonSerializer.Deserialize<TrackingEventPayload>(trackingEvent.PayloadJson);
        if (payload == null)
            return;

        await AttemptDispatchAsync(trackingEvent, log, integration, payload, ct);
        await _unitOfWork.SaveChangesAsync(ct);
    }

    private async Task AttemptDispatchAsync(
        TrackingEventAggregate trackingEvent,
        TrackingDispatchLog log,
        ProviderIntegration integration,
        TrackingEventPayload payload,
        CancellationToken ct)
    {
        var trackingProvider = _resolver.Resolve(integration.Provider);
        var credentials = trackingProvider == null
            ? null
            : await _providerConfiguration.GetCredentialsAsync(payload.StoreId, integration.Provider, ct);

        log.MarkProcessing();

        ProviderDispatchResult result;
        if (trackingProvider == null)
        {
            result = ProviderDispatchResult.Failure(null, null, $"No adapter is registered for provider {integration.Provider}", 0);
        }
        else if (credentials == null)
        {
            // The integration exists but its stored credentials couldn't be read/decrypted —
            // typically the encryption key ring changed since the token was saved. Reconnecting
            // the provider re-encrypts the token with the current key.
            result = ProviderDispatchResult.Failure(null, null, "Credentials missing or could not be decrypted — reconnect this provider", 0);
        }
        else
        {
            result = await trackingProvider.SendAsync(payload, credentials, ct);
        }

        _trackingLogger.Record(log, integration, result);
        _integrationRepository.Update(integration);
        _trackingEventRepository.Update(trackingEvent);

        if (!result.Succeeded && log.Status == DispatchStatus.Failed)
        {
            try
            {
                await _eventQueue.EnqueueAsync(new QueuedDispatch(trackingEvent.Id, log.Id, payload), ct);
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Could not enqueue fast-retry for dispatch {DispatchLogId}; the DB sweep will still pick it up", log.Id);
            }
        }
    }
}
