using Qaflaty.Application.Analytics.DTOs;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Analytics.Abstractions;

/// <summary>
/// Tracks, per store, distinct active users and distinct viewers per product over a rolling
/// 10-minute window (<see cref="PresenceSettings.Ttl"/>). Everything is keyed for <b>distinct-user</b>
/// counting via <see cref="VisitorKey"/> (the customer or guest id, shared across a browser's tabs):
/// <list type="bullet">
/// <item><b>Active users</b> = distinct persons who interacted in the last 10 minutes.</item>
/// <item><b>Per-product viewers</b> = distinct persons who opened that product in the last 10
/// minutes — the bucket is the product id, the person is only the dedup key inside it. A user who
/// opens three products counts once on each; a user re-touching or opening the same product in two
/// tabs counts once. This is a "how many distinct users viewed this product" statistic, not a
/// "where is this user right now" tracker, so viewing a new product does not remove the person from
/// products they already opened in the window — those age out on their own TTL.</item>
/// </list>
/// Counts are correct-by-construction (expiry checked at read time); <see cref="SweepExpiredAsync"/>
/// is only memory housekeeping. Singleton — in-memory is process-local, Redis is shared across
/// instances.
/// </summary>
public interface IPresenceTracker
{
    /// <summary>
    /// Records that <paramref name="visitor"/> is active on <paramref name="storeId"/> right now,
    /// and — when <paramref name="productSlug"/> is set — that they viewed that product. The product
    /// is identified by its URL slug (known to the storefront immediately, no product fetch needed).
    /// Additive: it refreshes this person's entry in the store and (if given) the product bucket, and
    /// never removes them from other products they opened earlier in the window.
    /// </summary>
    Task TouchAsync(StoreId storeId, VisitorKey visitor, string? productSlug, DateTime nowUtc, CancellationToken ct = default);

    /// <summary>
    /// Explicit "left the site" signal (tab/browser close beacon) — drops the person from the
    /// store-wide active-users count immediately. Product-view counts are a last-10-minutes
    /// statistic and are intentionally left to age out on their TTL.
    /// </summary>
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
