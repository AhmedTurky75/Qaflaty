using Qaflaty.Application.Analytics;
using Qaflaty.Application.Analytics.Abstractions;
using Qaflaty.Application.Analytics.DTOs;
using Qaflaty.Domain.Common.Identifiers;
using StackExchange.Redis;

namespace Qaflaty.Infrastructure.Services.Analytics;

/// <summary>
/// Redis-backed presence tracker — the production/multi-instance target, shared across every
/// API replica behind the load balancer. Sorted sets are keyed by visitor, scored by the
/// visitor's expiry timestamp (epoch ms), so membership counts (<c>ZCOUNT</c>) are correct
/// without a sweep; <see cref="SweepExpiredAsync"/> only reclaims memory (<c>ZREMRANGEBYSCORE</c>)
/// and reports which stores changed. A small set of "known store/product ids" is maintained
/// alongside the sorted sets so the sweep can iterate without a full keyspace scan.
/// Each operation currently issues a handful of round trips; batching them into a single Lua
/// script is a documented follow-up optimization (see docs/MERCHANT_ANALYTICS_REALTIME_PLAN.md §13)
/// once this is under real load.
/// </summary>
public class RedisPresenceTracker : IPresenceTracker
{
    private const string StoresSetKey = "presence:stores";

    private readonly IConnectionMultiplexer _redis;

    public RedisPresenceTracker(IConnectionMultiplexer redis)
    {
        _redis = redis;
    }

    private IDatabase Db => _redis.GetDatabase();

    private static string StoreKey(Guid storeId) => $"presence:store:{storeId}";
    private static string ProductKey(Guid storeId, Guid productId) => $"presence:store:{storeId}:prod:{productId}";
    private static string ProductSetKey(Guid storeId) => $"presence:store:{storeId}:products";
    private static string LocationKey(Guid storeId, string visitorKey) => $"presence:store:{storeId}:loc:{visitorKey}";

    public async Task TouchAsync(StoreId storeId, VisitorKey visitor, Guid? productId, DateTime nowUtc, CancellationToken ct = default)
    {
        var db = Db;
        var expiryMs = ToUnixMs(nowUtc.Add(PresenceSettings.Ttl));

        await db.SetAddAsync(StoresSetKey, storeId.Value.ToString());
        await db.SortedSetAddAsync(StoreKey(storeId.Value), visitor.Value, expiryMs);

        var locKey = LocationKey(storeId.Value, visitor.Value);
        var previousProductRaw = await db.StringGetAsync(locKey);
        var previousProduct = !previousProductRaw.IsNull && Guid.TryParse((string?)previousProductRaw, out var prevGuid)
            ? (Guid?)prevGuid
            : null;

        if (previousProduct != productId && previousProduct.HasValue)
            await db.SortedSetRemoveAsync(ProductKey(storeId.Value, previousProduct.Value), visitor.Value);

        if (productId.HasValue)
        {
            await db.SortedSetAddAsync(ProductKey(storeId.Value, productId.Value), visitor.Value, expiryMs);
            await db.SetAddAsync(ProductSetKey(storeId.Value), productId.Value.ToString());
            await db.StringSetAsync(locKey, productId.Value.ToString(), PresenceSettings.Ttl);
        }
        else
        {
            await db.KeyDeleteAsync(locKey);
        }
    }

    public async Task RemoveAsync(StoreId storeId, VisitorKey visitor, CancellationToken ct = default)
    {
        var db = Db;
        var locKey = LocationKey(storeId.Value, visitor.Value);
        var productRaw = await db.StringGetAsync(locKey);

        await db.SortedSetRemoveAsync(StoreKey(storeId.Value), visitor.Value);

        if (!productRaw.IsNull && Guid.TryParse((string?)productRaw, out var productId))
            await db.SortedSetRemoveAsync(ProductKey(storeId.Value, productId), visitor.Value);

        await db.KeyDeleteAsync(locKey);
    }

    public async Task<int> GetActiveUserCountAsync(StoreId storeId, DateTime nowUtc, CancellationToken ct = default)
    {
        var count = await Db.SortedSetLengthAsync(StoreKey(storeId.Value), ToUnixMs(nowUtc), double.PositiveInfinity, Exclude.Start);
        return (int)count;
    }

    public async Task<List<ProductViewerCountDto>> GetProductViewerCountsAsync(StoreId storeId, DateTime nowUtc, CancellationToken ct = default)
    {
        var db = Db;
        var productIds = await db.SetMembersAsync(ProductSetKey(storeId.Value));
        var nowMs = ToUnixMs(nowUtc);

        var result = new List<ProductViewerCountDto>();
        foreach (var member in productIds)
        {
            if (!Guid.TryParse((string?)member, out var productId)) continue;

            var count = await db.SortedSetLengthAsync(ProductKey(storeId.Value, productId), nowMs, double.PositiveInfinity, Exclude.Start);
            if (count > 0)
                result.Add(new ProductViewerCountDto(productId, (int)count));
        }

        return result.OrderByDescending(r => r.ViewerCount).ToList();
    }

    public async Task<IReadOnlyCollection<StoreId>> GetTrackedStoreIdsAsync(CancellationToken ct = default)
    {
        var members = await Db.SetMembersAsync(StoresSetKey);
        var result = new List<StoreId>();

        foreach (var member in members)
        {
            if (Guid.TryParse((string?)member, out var storeGuid))
                result.Add(new StoreId(storeGuid));
        }

        return result;
    }

    public async Task<IReadOnlyCollection<StoreId>> SweepExpiredAsync(DateTime nowUtc, CancellationToken ct = default)
    {
        var db = Db;
        var nowMs = ToUnixMs(nowUtc);
        var storeMembers = await db.SetMembersAsync(StoresSetKey);
        var changed = new List<StoreId>();

        foreach (var member in storeMembers)
        {
            if (!Guid.TryParse((string?)member, out var storeGuid)) continue;

            var removed = await db.SortedSetRemoveRangeByScoreAsync(StoreKey(storeGuid), double.NegativeInfinity, nowMs);

            var productIds = await db.SetMembersAsync(ProductSetKey(storeGuid));
            foreach (var productMember in productIds)
            {
                if (!Guid.TryParse((string?)productMember, out var productId)) continue;

                var productKey = ProductKey(storeGuid, productId);
                await db.SortedSetRemoveRangeByScoreAsync(productKey, double.NegativeInfinity, nowMs);

                var remaining = await db.SortedSetLengthAsync(productKey);
                if (remaining == 0)
                {
                    await db.KeyDeleteAsync(productKey);
                    await db.SetRemoveAsync(ProductSetKey(storeGuid), productMember);
                }
            }

            if (removed > 0)
                changed.Add(new StoreId(storeGuid));
        }

        return changed;
    }

    private static long ToUnixMs(DateTime utc) => new DateTimeOffset(DateTime.SpecifyKind(utc, DateTimeKind.Utc)).ToUnixTimeMilliseconds();
}
