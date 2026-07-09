using Qaflaty.Domain.Ads.Aggregates.TrackingEvent;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Domain.Ads.Repositories;

public interface ITrackingEventRepository
{
    Task<TrackingEvent?> GetByIdAsync(TrackingEventId id, CancellationToken ct = default);

    /// <summary>Finds an existing event for this store+eventKey+channel, used to make ingestion idempotent.</summary>
    Task<TrackingEvent?> GetByEventKeyAndChannelAsync(StoreId storeId, Guid eventKey, TrackingChannel channel, CancellationToken ct = default);

    Task<IReadOnlyList<TrackingEvent>> GetByCorrelationIdAsync(Guid correlationId, CancellationToken ct = default);

    Task<IReadOnlyList<TrackingEvent>> GetByOrderIdAsync(OrderId orderId, CancellationToken ct = default);

    Task<(IReadOnlyList<TrackingEvent> Items, int TotalCount)> SearchAsync(
        StoreId storeId,
        TrackingEventType? eventType,
        AdProvider? provider,
        DispatchStatus? status,
        DateTime? from,
        DateTime? to,
        int pageNumber,
        int pageSize,
        CancellationToken ct = default);

    /// <summary>Dispatch logs due for retry (Pending/Failed with NextRetryAt in the past), across all stores.</summary>
    Task<IReadOnlyList<TrackingEvent>> GetDueForRetryAsync(int batchSize, CancellationToken ct = default);

    Task AddAsync(TrackingEvent trackingEvent, CancellationToken ct = default);
    void Update(TrackingEvent trackingEvent);

    // Aggregate projections for the Dashboard/Monitoring pages.
    Task<int> CountEventsAsync(StoreId storeId, TrackingEventType? eventType, DateTime sinceUtc, CancellationToken ct = default);
    Task<int> CountDispatchesByStatusAsync(StoreId storeId, DispatchStatus status, DateTime sinceUtc, CancellationToken ct = default);
    Task<double> GetAverageDispatchDurationMsAsync(StoreId storeId, DateTime sinceUtc, CancellationToken ct = default);
    Task<IReadOnlyList<(AdProvider Provider, int EventCount)>> GetEventCountsByProviderAsync(StoreId storeId, DateTime sinceUtc, CancellationToken ct = default);
    Task<IReadOnlyList<(AdProvider Provider, int SuccessCount, int FailureCount, double AvgDurationMs)>> GetProviderMonitoringStatsAsync(StoreId storeId, DateTime sinceUtc, CancellationToken ct = default);
}
