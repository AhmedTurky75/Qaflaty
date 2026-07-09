using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Ads.Aggregates.ProviderIntegration;
using Qaflaty.Domain.Ads.Aggregates.TrackingEvent;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Ads.Repositories;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.UnitTests.Infrastructure.Ads;

/// <summary>Hand-written in-memory fakes for EventDispatcherService tests (no mocking library, matching the project's fake-based test style).</summary>
internal sealed class InMemoryProviderIntegrationRepository : IProviderIntegrationRepository
{
    private readonly List<ProviderIntegration> _store;

    public InMemoryProviderIntegrationRepository(params ProviderIntegration[] seed) => _store = seed.ToList();

    public Task<ProviderIntegration?> GetByIdAsync(ProviderIntegrationId id, CancellationToken ct = default)
        => Task.FromResult(_store.FirstOrDefault(p => p.Id == id));

    public Task<ProviderIntegration?> GetByStoreAndProviderAsync(StoreId storeId, AdProvider provider, CancellationToken ct = default)
        => Task.FromResult(_store.FirstOrDefault(p => p.StoreId == storeId && p.Provider == provider));

    public Task<IReadOnlyList<ProviderIntegration>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default)
        => Task.FromResult<IReadOnlyList<ProviderIntegration>>(_store.Where(p => p.StoreId == storeId).ToList());

    public Task AddAsync(ProviderIntegration integration, CancellationToken ct = default)
    {
        _store.Add(integration);
        return Task.CompletedTask;
    }

    public void Update(ProviderIntegration integration) { }
}

internal sealed class InMemoryTrackingEventRepository : ITrackingEventRepository
{
    public readonly List<TrackingEvent> Store = [];
    public int AddCallCount { get; private set; }

    public Task<TrackingEvent?> GetByIdAsync(TrackingEventId id, CancellationToken ct = default)
        => Task.FromResult(Store.FirstOrDefault(t => t.Id == id));

    public Task<TrackingEvent?> GetByEventKeyAndChannelAsync(StoreId storeId, Guid eventKey, TrackingChannel channel, CancellationToken ct = default)
        => Task.FromResult(Store.FirstOrDefault(t => t.StoreId == storeId && t.EventKey == eventKey && t.Channel == channel));

    public Task<IReadOnlyList<TrackingEvent>> GetByCorrelationIdAsync(Guid correlationId, CancellationToken ct = default)
        => Task.FromResult<IReadOnlyList<TrackingEvent>>(Store.Where(t => t.CorrelationId == correlationId).ToList());

    public Task<IReadOnlyList<TrackingEvent>> GetByOrderIdAsync(OrderId orderId, CancellationToken ct = default)
        => Task.FromResult<IReadOnlyList<TrackingEvent>>(Store.Where(t => t.OrderId == orderId).ToList());

    public Task<(IReadOnlyList<TrackingEvent> Items, int TotalCount)> SearchAsync(
        StoreId storeId, TrackingEventType? eventType, AdProvider? provider, DispatchStatus? status,
        DateTime? from, DateTime? to, int pageNumber, int pageSize, CancellationToken ct = default)
        => throw new NotSupportedException();

    public Task<IReadOnlyList<TrackingEvent>> GetDueForRetryAsync(int batchSize, CancellationToken ct = default)
        => throw new NotSupportedException();

    public Task AddAsync(TrackingEvent trackingEvent, CancellationToken ct = default)
    {
        AddCallCount++;
        Store.Add(trackingEvent);
        return Task.CompletedTask;
    }

    public void Update(TrackingEvent trackingEvent) { }

    public Task<int> CountEventsAsync(StoreId storeId, TrackingEventType? eventType, DateTime sinceUtc, CancellationToken ct = default)
        => throw new NotSupportedException();
    public Task<int> CountDispatchesByStatusAsync(StoreId storeId, DispatchStatus status, DateTime sinceUtc, CancellationToken ct = default)
        => throw new NotSupportedException();
    public Task<double> GetAverageDispatchDurationMsAsync(StoreId storeId, DateTime sinceUtc, CancellationToken ct = default)
        => throw new NotSupportedException();
    public Task<IReadOnlyList<(AdProvider Provider, int EventCount)>> GetEventCountsByProviderAsync(StoreId storeId, DateTime sinceUtc, CancellationToken ct = default)
        => throw new NotSupportedException();
    public Task<IReadOnlyList<(AdProvider Provider, int SuccessCount, int FailureCount, double AvgDurationMs)>> GetProviderMonitoringStatsAsync(StoreId storeId, DateTime sinceUtc, CancellationToken ct = default)
        => throw new NotSupportedException();
}

internal sealed class StubTrackingProvider : ITrackingProvider
{
    private readonly bool _succeeds;
    public int SendCallCount { get; private set; }

    public StubTrackingProvider(AdProvider provider, bool succeeds = true)
    {
        Provider = provider;
        _succeeds = succeeds;
    }

    public AdProvider Provider { get; }

    public Task<Qaflaty.Domain.Common.Errors.Result> VerifyAsync(ProviderCredentialSet credentials, CancellationToken ct)
        => Task.FromResult(Qaflaty.Domain.Common.Errors.Result.Success());

    public Task<ProviderDispatchResult> SendAsync(TrackingEventPayload payload, ProviderCredentialSet credentials, CancellationToken ct)
    {
        SendCallCount++;
        return Task.FromResult(_succeeds
            ? ProviderDispatchResult.Success(200, "{}", 10)
            : ProviderDispatchResult.Failure(500, "{}", "boom", 10));
    }
}

internal sealed class FakeTrackingProviderResolver : ITrackingProviderResolver
{
    private readonly Dictionary<AdProvider, ITrackingProvider> _providers;

    public FakeTrackingProviderResolver(params ITrackingProvider[] providers)
        => _providers = providers.ToDictionary(p => p.Provider);

    public ITrackingProvider? Resolve(AdProvider provider) => _providers.GetValueOrDefault(provider);
}

internal sealed class FakeProviderConfiguration : IProviderConfiguration
{
    public Task<ProviderCredentialSet?> GetCredentialsAsync(StoreId storeId, AdProvider provider, CancellationToken ct)
        => Task.FromResult<ProviderCredentialSet?>(new ProviderCredentialSet(new Dictionary<string, string> { ["pixelId"] = "123" }));
}

internal sealed class FakeEventQueue : IEventQueue
{
    public readonly List<QueuedDispatch> Enqueued = [];

    public ValueTask EnqueueAsync(QueuedDispatch dispatch, CancellationToken ct)
    {
        Enqueued.Add(dispatch);
        return ValueTask.CompletedTask;
    }

    public IAsyncEnumerable<QueuedDispatch> ReadAllAsync(CancellationToken ct) => throw new NotSupportedException();
}

internal sealed class NoOpUnitOfWork : IUnitOfWork
{
    public int SaveCallCount { get; private set; }

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        SaveCallCount++;
        return Task.FromResult(0);
    }
}
