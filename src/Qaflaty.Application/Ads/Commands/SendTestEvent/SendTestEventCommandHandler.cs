using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Application.Ads.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Ads.Errors;
using Qaflaty.Domain.Ads.Repositories;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using TrackingEventAggregate = Qaflaty.Domain.Ads.Aggregates.TrackingEvent.TrackingEvent;

namespace Qaflaty.Application.Ads.Commands.SendTestEvent;

/// <summary>
/// Fires a synthetic server-channel event with test data through the real dispatch
/// pipeline, so the merchant can watch it land in e.g. Meta's Test Events tab immediately.
/// </summary>
public class SendTestEventCommandHandler : ICommandHandler<SendTestEventCommand, TrackingLogRowDto[]>
{
    private readonly IStoreRepository _storeRepository;
    private readonly ITrackingEventRepository _trackingEventRepository;
    private readonly IEventDispatcher _eventDispatcher;
    private readonly ICurrentUserService _currentUserService;

    public SendTestEventCommandHandler(
        IStoreRepository storeRepository,
        ITrackingEventRepository trackingEventRepository,
        IEventDispatcher eventDispatcher,
        ICurrentUserService currentUserService)
    {
        _storeRepository = storeRepository;
        _trackingEventRepository = trackingEventRepository;
        _eventDispatcher = eventDispatcher;
        _currentUserService = currentUserService;
    }

    public async Task<Result<TrackingLogRowDto[]>> Handle(SendTestEventCommand request, CancellationToken cancellationToken)
    {
        var storeId = StoreId.From(request.StoreId);
        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null ||
            !await _storeRepository.CanMerchantAccessStoreAsync(_currentUserService.MerchantId ?? default, storeId, cancellationToken))
            return Result.Failure<TrackingLogRowDto[]>(AdsErrors.Forbidden);

        var eventKey = Guid.NewGuid();
        var payload = new TrackingEventPayload(
            storeId,
            eventKey,
            request.EventType,
            TrackingChannel.Server,
            DateTime.UtcNow,
            OrderId: null,
            CustomerRef: "test-center",
            Value: 99.99m,
            Currency: store.Currency.Code,
            Contents: [new TrackingContentItem("TEST-PRODUCT", 1, 99.99m)],
            PageUrl: null,
            ClientIpAddress: null,
            ClientUserAgent: "Qaflaty-Test-Center",
            CustomerEmail: "test@qaflaty.com",
            CustomerPhone: null);

        await _eventDispatcher.DispatchAsync(payload, cancellationToken);

        var trackingEvent = await _trackingEventRepository.GetByEventKeyAndChannelAsync(storeId, eventKey, TrackingChannel.Server, cancellationToken);
        if (trackingEvent == null)
            return Result.Success(Array.Empty<TrackingLogRowDto>());

        var rows = trackingEvent.DispatchLogs.Select(log => new TrackingLogRowDto(
            trackingEvent.Id.Value,
            log.Id,
            trackingEvent.CreatedAt,
            log.Provider.ToString(),
            trackingEvent.EventType.ToString(),
            trackingEvent.OrderId?.Value,
            trackingEvent.Channel.ToString(),
            log.Status.ToString(),
            log.AttemptCount,
            log.DurationMs,
            log.ResponseStatus,
            log.ResponseBody,
            log.ErrorMessage,
            trackingEvent.CorrelationId)).ToArray();

        return Result.Success(rows);
    }
}
