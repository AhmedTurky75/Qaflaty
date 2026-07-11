using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Ads.Aggregates.TrackingEvent;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Ads.Repositories;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class TrackingEventRepository : ITrackingEventRepository
{
    private readonly QaflatyDbContext _context;

    public TrackingEventRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    private IQueryable<TrackingEvent> Query() => _context.TrackingEvents.Include(t => t.DispatchLogs);

    public async Task<TrackingEvent?> GetByIdAsync(TrackingEventId id, CancellationToken ct = default)
        => await Query().FirstOrDefaultAsync(t => t.Id == id, ct);

    public async Task<TrackingEvent?> GetByEventKeyAndChannelAsync(StoreId storeId, Guid eventKey, TrackingChannel channel, CancellationToken ct = default)
        => await Query().FirstOrDefaultAsync(t => t.StoreId == storeId && t.EventKey == eventKey && t.Channel == channel, ct);

    public async Task<IReadOnlyList<TrackingEvent>> GetByCorrelationIdAsync(Guid correlationId, CancellationToken ct = default)
        => await Query().Where(t => t.CorrelationId == correlationId).OrderBy(t => t.CreatedAt).ToListAsync(ct);

    public async Task<IReadOnlyList<TrackingEvent>> GetByOrderIdAsync(OrderId orderId, CancellationToken ct = default)
        => await Query().Where(t => t.OrderId == orderId).OrderBy(t => t.CreatedAt).ToListAsync(ct);

    public async Task<(IReadOnlyList<TrackingEvent> Items, int TotalCount)> SearchAsync(
        StoreId storeId,
        TrackingEventType? eventType,
        AdProvider? provider,
        DispatchStatus? status,
        DateTime? from,
        DateTime? to,
        int pageNumber,
        int pageSize,
        CancellationToken ct = default)
    {
        var query = Query().Where(t => t.StoreId == storeId);

        if (eventType.HasValue)
            query = query.Where(t => t.EventType == eventType.Value);
        if (from.HasValue)
            query = query.Where(t => t.CreatedAt >= from.Value);
        if (to.HasValue)
            query = query.Where(t => t.CreatedAt <= to.Value);
        if (provider.HasValue)
            query = query.Where(t => t.DispatchLogs.Any(l => l.Provider == provider.Value));
        if (status.HasValue)
            query = query.Where(t => t.DispatchLogs.Any(l => l.Status == status.Value));

        var totalCount = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }

    public async Task<IReadOnlyList<TrackingEvent>> GetDueForRetryAsync(int batchSize, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        return await Query()
            .Where(t => t.DispatchLogs.Any(l =>
                (l.Status == DispatchStatus.Pending || l.Status == DispatchStatus.Failed) &&
                l.NextRetryAt != null && l.NextRetryAt <= now))
            .Take(batchSize)
            .ToListAsync(ct);
    }

    public async Task AddAsync(TrackingEvent trackingEvent, CancellationToken ct = default)
        => await _context.TrackingEvents.AddAsync(trackingEvent, ct);

    public void Update(TrackingEvent trackingEvent)
        => _context.TrackingEvents.Update(trackingEvent);

    public async Task<int> CountEventsAsync(StoreId storeId, TrackingEventType? eventType, DateTime sinceUtc, CancellationToken ct = default)
    {
        var query = _context.TrackingEvents.Where(t => t.StoreId == storeId && t.CreatedAt >= sinceUtc);
        if (eventType.HasValue)
            query = query.Where(t => t.EventType == eventType.Value);
        return await query.CountAsync(ct);
    }

    public async Task<int> CountDispatchesByStatusAsync(StoreId storeId, DispatchStatus status, DateTime sinceUtc, CancellationToken ct = default)
        => await _context.TrackingEvents
            .Where(t => t.StoreId == storeId && t.CreatedAt >= sinceUtc)
            .SelectMany(t => t.DispatchLogs)
            .CountAsync(l => l.Status == status, ct);

    public async Task<double> GetAverageDispatchDurationMsAsync(StoreId storeId, DateTime sinceUtc, CancellationToken ct = default)
    {
        var durations = await _context.TrackingEvents
            .Where(t => t.StoreId == storeId && t.CreatedAt >= sinceUtc)
            .SelectMany(t => t.DispatchLogs)
            .Where(l => l.DurationMs != null)
            .Select(l => l.DurationMs!.Value)
            .ToListAsync(ct);

        return durations.Count == 0 ? 0 : durations.Average();
    }

    public async Task<IReadOnlyList<(AdProvider Provider, int EventCount)>> GetEventCountsByProviderAsync(StoreId storeId, DateTime sinceUtc, CancellationToken ct = default)
    {
        var grouped = await _context.TrackingEvents
            .Where(t => t.StoreId == storeId && t.CreatedAt >= sinceUtc)
            .SelectMany(t => t.DispatchLogs)
            .GroupBy(l => l.Provider)
            .Select(g => new { Provider = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        return grouped.Select(g => (g.Provider, g.Count)).ToList();
    }

    public async Task<IReadOnlyList<(AdProvider Provider, int SuccessCount, int FailureCount, double AvgDurationMs)>> GetProviderMonitoringStatsAsync(
        StoreId storeId, DateTime sinceUtc, CancellationToken ct = default)
    {
        var logs = await _context.TrackingEvents
            .Where(t => t.StoreId == storeId && t.CreatedAt >= sinceUtc)
            .SelectMany(t => t.DispatchLogs)
            .Select(l => new { l.Provider, l.Status, l.DurationMs })
            .ToListAsync(ct);

        return logs
            .GroupBy(l => l.Provider)
            .Select(g => (
                Provider: g.Key,
                SuccessCount: g.Count(l => l.Status == DispatchStatus.Succeeded),
                FailureCount: g.Count(l => l.Status is DispatchStatus.Failed or DispatchStatus.DeadLettered),
                AvgDurationMs: g.Where(l => l.DurationMs != null).Select(l => l.DurationMs!.Value).DefaultIfEmpty(0).Average()))
            .ToList();
    }
}
