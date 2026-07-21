using System.Collections.Concurrent;
using Qaflaty.Application.Analytics;
using Qaflaty.Application.Analytics.Abstractions;
using Qaflaty.Application.Analytics.DTOs;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Services.Analytics;

/// <summary>
/// Process-local presence tracker — the default when no Redis connection string is configured.
/// Correct for a single API instance; state does not survive a restart and is not shared across
/// instances (see <see cref="RedisPresenceTracker"/> for the load-balanced deployment target).
///
/// Two maps per store, both keyed by person for distinct-user counting:
/// <c>Persons</c> (personKey → expiry) backs the store-wide active-user count, and
/// <c>ProductViewers</c> (productId → personKey → expiry) backs per-product distinct viewers. A
/// heartbeat just refreshes the person's expiry in the store and in the product they're viewing;
/// nothing is removed on navigation, so a user who opens several products counts on each until each
/// product's entry ages out. Counts filter by expiry at read time, so
/// <see cref="SweepExpiredAsync"/> is only memory housekeeping.
/// </summary>
public class InMemoryPresenceTracker : IPresenceTracker
{
    private sealed class StoreState
    {
        public readonly ConcurrentDictionary<string, long> Persons = new();
        public readonly ConcurrentDictionary<Guid, ConcurrentDictionary<string, long>> ProductViewers = new();
    }

    private readonly ConcurrentDictionary<Guid, StoreState> _stores = new();

    public Task TouchAsync(StoreId storeId, VisitorKey visitor, Guid? productId, DateTime nowUtc, CancellationToken ct = default)
    {
        var state = _stores.GetOrAdd(storeId.Value, static _ => new StoreState());
        var expiryTicks = nowUtc.Add(PresenceSettings.Ttl).Ticks;

        state.Persons[visitor.Value] = expiryTicks;

        if (productId.HasValue)
        {
            var viewers = state.ProductViewers.GetOrAdd(productId.Value, static _ => new ConcurrentDictionary<string, long>());
            viewers[visitor.Value] = expiryTicks;
        }

        return Task.CompletedTask;
    }

    public Task RemoveAsync(StoreId storeId, VisitorKey visitor, CancellationToken ct = default)
    {
        // Drop from the store-wide active-user count only; product-view stats age out on their TTL.
        if (_stores.TryGetValue(storeId.Value, out var state))
            state.Persons.TryRemove(visitor.Value, out _);

        return Task.CompletedTask;
    }

    public Task<int> GetActiveUserCountAsync(StoreId storeId, DateTime nowUtc, CancellationToken ct = default)
    {
        if (!_stores.TryGetValue(storeId.Value, out var state))
            return Task.FromResult(0);

        var nowTicks = nowUtc.Ticks;
        return Task.FromResult(state.Persons.Count(kv => kv.Value > nowTicks));
    }

    public Task<List<ProductViewerCountDto>> GetProductViewerCountsAsync(StoreId storeId, DateTime nowUtc, CancellationToken ct = default)
    {
        if (!_stores.TryGetValue(storeId.Value, out var state))
            return Task.FromResult(new List<ProductViewerCountDto>());

        var nowTicks = nowUtc.Ticks;
        var result = state.ProductViewers
            .Select(kv => new ProductViewerCountDto(kv.Key, kv.Value.Count(v => v.Value > nowTicks)))
            .Where(d => d.ViewerCount > 0)
            .OrderByDescending(d => d.ViewerCount)
            .ToList();

        return Task.FromResult(result);
    }

    public Task SweepExpiredAsync(DateTime nowUtc, CancellationToken ct = default)
    {
        var nowTicks = nowUtc.Ticks;

        foreach (var (_, state) in _stores)
        {
            foreach (var kv in state.Persons)
            {
                if (kv.Value <= nowTicks)
                    state.Persons.TryRemove(kv.Key, out _);
            }

            foreach (var (productId, viewers) in state.ProductViewers)
            {
                foreach (var kv in viewers)
                {
                    if (kv.Value <= nowTicks)
                        viewers.TryRemove(kv.Key, out _);
                }

                if (viewers.IsEmpty)
                    state.ProductViewers.TryRemove(productId, out _);
            }
        }

        return Task.CompletedTask;
    }
}
