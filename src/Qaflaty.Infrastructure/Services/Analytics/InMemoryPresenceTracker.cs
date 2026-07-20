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
/// Counts are correct-by-construction: a visitor's expiry timestamp is checked at read time, so
/// no explicit cleanup is required for correctness — <see cref="SweepExpiredAsync"/> only reclaims
/// memory and detects which stores' counts changed for the push notifier.
/// </summary>
public class InMemoryPresenceTracker : IPresenceTracker
{
    private sealed class StoreState
    {
        public readonly ConcurrentDictionary<string, long> Visitors = new();
        public readonly ConcurrentDictionary<string, Guid?> VisitorProduct = new();
        public readonly ConcurrentDictionary<Guid, ConcurrentDictionary<string, long>> ProductVisitors = new();
    }

    private readonly ConcurrentDictionary<Guid, StoreState> _stores = new();

    public Task TouchAsync(StoreId storeId, VisitorKey visitor, Guid? productId, DateTime nowUtc, CancellationToken ct = default)
    {
        var state = _stores.GetOrAdd(storeId.Value, static _ => new StoreState());
        var expiryTicks = nowUtc.Add(PresenceSettings.Ttl).Ticks;

        state.Visitors[visitor.Value] = expiryTicks;

        var previousProduct = state.VisitorProduct.TryGetValue(visitor.Value, out var prev) ? prev : null;
        if (previousProduct != productId && previousProduct.HasValue)
            RemoveFromProductSet(state, previousProduct.Value, visitor.Value);

        if (productId.HasValue)
        {
            var set = state.ProductVisitors.GetOrAdd(productId.Value, static _ => new ConcurrentDictionary<string, long>());
            set[visitor.Value] = expiryTicks;
        }

        state.VisitorProduct[visitor.Value] = productId;
        return Task.CompletedTask;
    }

    public Task RemoveAsync(StoreId storeId, VisitorKey visitor, CancellationToken ct = default)
    {
        if (!_stores.TryGetValue(storeId.Value, out var state))
            return Task.CompletedTask;

        state.Visitors.TryRemove(visitor.Value, out _);
        if (state.VisitorProduct.TryRemove(visitor.Value, out var productId) && productId.HasValue)
            RemoveFromProductSet(state, productId.Value, visitor.Value);

        return Task.CompletedTask;
    }

    public Task<int> GetActiveUserCountAsync(StoreId storeId, DateTime nowUtc, CancellationToken ct = default)
    {
        if (!_stores.TryGetValue(storeId.Value, out var state))
            return Task.FromResult(0);

        var nowTicks = nowUtc.Ticks;
        return Task.FromResult(state.Visitors.Count(kv => kv.Value > nowTicks));
    }

    public Task<List<ProductViewerCountDto>> GetProductViewerCountsAsync(StoreId storeId, DateTime nowUtc, CancellationToken ct = default)
    {
        if (!_stores.TryGetValue(storeId.Value, out var state))
            return Task.FromResult(new List<ProductViewerCountDto>());

        var nowTicks = nowUtc.Ticks;
        var result = state.ProductVisitors
            .Select(kv => new ProductViewerCountDto(kv.Key, kv.Value.Count(v => v.Value > nowTicks)))
            .Where(d => d.ViewerCount > 0)
            .OrderByDescending(d => d.ViewerCount)
            .ToList();

        return Task.FromResult(result);
    }

    public Task SweepExpiredAsync(DateTime nowUtc, CancellationToken ct = default)
    {
        var nowTicks = nowUtc.Ticks;

        foreach (var (storeGuid, state) in _stores)
        {
            foreach (var kv in state.Visitors)
            {
                if (kv.Value <= nowTicks)
                    state.Visitors.TryRemove(kv.Key, out _);
            }

            foreach (var (productId, set) in state.ProductVisitors)
            {
                foreach (var kv in set)
                {
                    if (kv.Value <= nowTicks)
                        set.TryRemove(kv.Key, out _);
                }

                if (set.IsEmpty)
                    state.ProductVisitors.TryRemove(productId, out _);
            }

            // Reclaim the reverse index for visitors who fully expired.
            foreach (var visitorKey in state.VisitorProduct.Keys)
            {
                if (!state.Visitors.ContainsKey(visitorKey))
                    state.VisitorProduct.TryRemove(visitorKey, out _);
            }
        }

        return Task.CompletedTask;
    }

    private static void RemoveFromProductSet(StoreState state, Guid productId, string visitorKey)
    {
        if (!state.ProductVisitors.TryGetValue(productId, out var set))
            return;

        set.TryRemove(visitorKey, out _);
        if (set.IsEmpty)
            state.ProductVisitors.TryRemove(productId, out _);
    }
}
