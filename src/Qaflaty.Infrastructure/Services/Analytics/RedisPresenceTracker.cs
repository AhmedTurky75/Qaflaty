using Qaflaty.Application.Analytics;
using Qaflaty.Application.Analytics.Abstractions;
using Qaflaty.Application.Analytics.DTOs;
using Qaflaty.Domain.Common.Identifiers;
using StackExchange.Redis;

namespace Qaflaty.Infrastructure.Services.Analytics;

/// <summary>
/// Redis-backed presence tracker — the production/multi-instance target, shared across every API
/// replica. Same model as <see cref="InMemoryPresenceTracker"/>, using sorted sets scored by expiry
/// so distinct-user counts are a single <c>ZCOUNT</c> over the live window:
/// <list type="bullet">
/// <item><c>presence:store:{id}:persons</c> — members are person keys; store-wide active users.</item>
/// <item><c>presence:store:{id}:prod:{productId}</c> — members are person keys; distinct viewers of
/// that product. A person's repeat/multi-tab views collapse to one member; opening several products
/// adds them to several buckets.</item>
/// </list>
/// A heartbeat only ever adds/refreshes members, so no reverse index or move logic is needed.
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

    private static string PersonsKey(Guid storeId) => $"presence:store:{storeId}:persons";
    private static string ProductsKey(Guid storeId) => $"presence:store:{storeId}:products";
    private static string ProductKey(Guid storeId, Guid productId) => $"presence:store:{storeId}:prod:{productId}";

    public async Task TouchAsync(StoreId storeId, VisitorKey visitor, Guid? productId, DateTime nowUtc, CancellationToken ct = default)
    {
        var db = Db;
        var s = storeId.Value;
        var person = visitor.Value;
        var expiryMs = ToUnixMs(nowUtc.Add(PresenceSettings.Ttl));

        await db.SetAddAsync(StoresSetKey, s.ToString());
        await db.SortedSetAddAsync(PersonsKey(s), person, expiryMs);

        if (productId.HasValue)
        {
            await db.SortedSetAddAsync(ProductKey(s, productId.Value), person, expiryMs);
            await db.SetAddAsync(ProductsKey(s), productId.Value.ToString());
        }
    }

    public async Task RemoveAsync(StoreId storeId, VisitorKey visitor, CancellationToken ct = default)
    {
        // Drop from the store-wide active-user count only; product-view stats age out on their TTL.
        await Db.SortedSetRemoveAsync(PersonsKey(storeId.Value), visitor.Value);
    }

    public async Task<int> GetActiveUserCountAsync(StoreId storeId, DateTime nowUtc, CancellationToken ct = default)
    {
        var count = await Db.SortedSetLengthAsync(PersonsKey(storeId.Value), ToUnixMs(nowUtc), double.PositiveInfinity, Exclude.Start);
        return (int)count;
    }

    public async Task<List<ProductViewerCountDto>> GetProductViewerCountsAsync(StoreId storeId, DateTime nowUtc, CancellationToken ct = default)
    {
        var db = Db;
        var s = storeId.Value;
        var nowMs = ToUnixMs(nowUtc);
        var productIds = await db.SetMembersAsync(ProductsKey(s));

        var result = new List<ProductViewerCountDto>();
        foreach (var pm in productIds)
        {
            if (!Guid.TryParse((string?)pm, out var productId)) continue;

            var count = await db.SortedSetLengthAsync(ProductKey(s, productId), nowMs, double.PositiveInfinity, Exclude.Start);
            if (count > 0)
                result.Add(new ProductViewerCountDto(productId, (int)count));
        }

        return result.OrderByDescending(r => r.ViewerCount).ToList();
    }

    public async Task SweepExpiredAsync(DateTime nowUtc, CancellationToken ct = default)
    {
        var db = Db;
        var nowMs = ToUnixMs(nowUtc);
        var storeMembers = await db.SetMembersAsync(StoresSetKey);

        foreach (var sm in storeMembers)
        {
            if (!Guid.TryParse((string?)sm, out var s)) continue;

            await db.SortedSetRemoveRangeByScoreAsync(PersonsKey(s), double.NegativeInfinity, nowMs);

            var productIds = await db.SetMembersAsync(ProductsKey(s));
            foreach (var pm in productIds)
            {
                if (!Guid.TryParse((string?)pm, out var productId)) continue;

                var pk = ProductKey(s, productId);
                await db.SortedSetRemoveRangeByScoreAsync(pk, double.NegativeInfinity, nowMs);

                if (await db.SortedSetLengthAsync(pk) == 0)
                {
                    await db.KeyDeleteAsync(pk);
                    await db.SetRemoveAsync(ProductsKey(s), pm);
                }
            }
        }
    }

    private static long ToUnixMs(DateTime utc) => new DateTimeOffset(DateTime.SpecifyKind(utc, DateTimeKind.Utc)).ToUnixTimeMilliseconds();
}
