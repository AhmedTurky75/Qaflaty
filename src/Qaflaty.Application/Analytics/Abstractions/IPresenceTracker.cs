using Qaflaty.Application.Analytics.DTOs;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Analytics.Abstractions;

/// <summary>
/// Tracks which visitors are currently active per store (and, optionally, per product page).
/// Implementations are TTL-based: a visitor counts as active only while their most recent
/// <see cref="TouchAsync"/> is within <see cref="PresenceSettings.Ttl"/> of "now" — counts are
/// therefore correct-by-construction without waiting for a sweep. Registered as a singleton;
/// the in-memory implementation is process-local, the Redis implementation is shared across
/// instances (required for load-balanced deployments).
/// </summary>
public interface IPresenceTracker
{
    /// <summary>
    /// Records that <paramref name="visitor"/> is active on <paramref name="storeId"/> right now,
    /// optionally viewing <paramref name="productId"/>. Moves the visitor between product buckets
    /// automatically when the product changes from their last touch.
    /// </summary>
    Task TouchAsync(StoreId storeId, VisitorKey visitor, Guid? productId, DateTime nowUtc, CancellationToken ct = default);

    /// <summary>Explicit "leave" signal (tab/browser close) — removes the visitor immediately rather than waiting for TTL expiry.</summary>
    Task RemoveAsync(StoreId storeId, VisitorKey visitor, CancellationToken ct = default);

    Task<int> GetActiveUserCountAsync(StoreId storeId, DateTime nowUtc, CancellationToken ct = default);

    Task<List<ProductViewerCountDto>> GetProductViewerCountsAsync(StoreId storeId, DateTime nowUtc, CancellationToken ct = default);

    /// <summary>
    /// Reclaims memory held by visitors whose TTL has lapsed, across all tracked stores. Counts are
    /// already correct-by-construction (expiry is checked at read time), so this is housekeeping
    /// only — the sweeper's change detection works off live counts, not this method's result.
    /// </summary>
    Task SweepExpiredAsync(DateTime nowUtc, CancellationToken ct = default);
}
