using Microsoft.Extensions.Caching.Memory;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Services.Storefront;

/// <summary>
/// In-memory implementation of the downsell frequency cap. Fine for a single-instance API; if the
/// API is ever scaled out horizontally, swap the backing store for a distributed cache (Redis is
/// already wired up for SignalR) without changing the interface.
/// </summary>
public class DownsellFrequencyCapStore : IDownsellFrequencyCapStore
{
    private readonly IMemoryCache _cache;
    private readonly object _lock = new();

    public DownsellFrequencyCapStore(IMemoryCache cache)
    {
        _cache = cache;
    }

    public bool TryRecordImpression(
        StoreId storeId, string sessionKey, int maxShowsPerSession, int minIntervalSeconds)
    {
        var key = $"downsell:{storeId.Value}:{sessionKey}";

        lock (_lock)
        {
            var state = _cache.Get<CapState>(key);
            var now = DateTime.UtcNow;

            if (state is not null)
            {
                if (state.ShowCount >= maxShowsPerSession)
                    return false;

                if ((now - state.LastShownAt).TotalSeconds < minIntervalSeconds)
                    return false;
            }

            var updated = new CapState((state?.ShowCount ?? 0) + 1, now);
            _cache.Set(key, updated, TimeSpan.FromHours(12)); // session-scoped; expires with a generous idle window

            return true;
        }
    }

    private sealed record CapState(int ShowCount, DateTime LastShownAt);
}
