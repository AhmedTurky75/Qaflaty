using System.Collections.Concurrent;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Qaflaty.Application.Analytics;
using Qaflaty.Application.Analytics.Abstractions;
using Qaflaty.Application.Analytics.DTOs;
using Qaflaty.Application.Common.Interfaces;

namespace Qaflaty.Infrastructure.Services.Analytics;

/// <summary>
/// Periodically reclaims expired presence entries and pushes live-metrics updates to merchants
/// watching a store whose state actually changed since the last tick. <see cref="IPresenceTracker"/>
/// and <see cref="IRealtimeNotifier"/> are both singletons, so — unlike <c>TrackingRetryWorker</c> —
/// no <c>IServiceScopeFactory</c> scope is needed here; nothing touches the database.
/// </summary>
/// <remarks>
/// Change detection compares a signature of (active user count + per-product viewer counts)
/// against the previous tick — not just <see cref="IPresenceTracker.SweepExpiredAsync"/>'s
/// removed-by-TTL result. A sweep only ever reports departures; without this diff, new visitors
/// arriving or an existing visitor switching product pages would never trigger a push, since
/// nothing "expired" in either case.
/// </remarks>
public class PresenceSweeper : BackgroundService
{
    private readonly IPresenceTracker _presenceTracker;
    private readonly IRealtimeNotifier _realtimeNotifier;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ILogger<PresenceSweeper> _logger;

    // Singleton-lifetime cache of each store's last-pushed state signature, so we only push when
    // something actually changed (no product-name lookups here — see IRealtimeNotifier docs).
    private readonly ConcurrentDictionary<Guid, string> _lastSignatures = new();

    public PresenceSweeper(
        IPresenceTracker presenceTracker,
        IRealtimeNotifier realtimeNotifier,
        IDateTimeProvider dateTimeProvider,
        ILogger<PresenceSweeper> logger)
    {
        _presenceTracker = presenceTracker;
        _realtimeNotifier = realtimeNotifier;
        _dateTimeProvider = dateTimeProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("PresenceSweeper started (interval: {Interval})", PresenceSettings.SweepInterval);

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(PresenceSettings.SweepInterval, stoppingToken);

            try
            {
                var now = _dateTimeProvider.UtcNow;

                // Memory reclaim only — see the class remarks for why its result isn't used for
                // change detection.
                await _presenceTracker.SweepExpiredAsync(now, stoppingToken);

                var trackedStores = await _presenceTracker.GetTrackedStoreIdsAsync(stoppingToken);
                foreach (var storeId in trackedStores)
                {
                    var activeUsers = await _presenceTracker.GetActiveUserCountAsync(storeId, now, stoppingToken);
                    var productViewers = await _presenceTracker.GetProductViewerCountsAsync(storeId, now, stoppingToken);
                    var signature = BuildSignature(activeUsers, productViewers);

                    var previousSignature = _lastSignatures.GetOrAdd(storeId.Value, string.Empty);
                    if (signature == previousSignature)
                        continue;

                    _lastSignatures[storeId.Value] = signature;
                    await _realtimeNotifier.NotifyPresenceChangedAsync(storeId, activeUsers, stoppingToken);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Error during presence sweep");
            }
        }
    }

    private static string BuildSignature(int activeUsers, List<ProductViewerCountDto> productViewers)
    {
        var productsPart = string.Join(
            ",", productViewers.OrderBy(p => p.ProductId).Select(p => $"{p.ProductId}:{p.ViewerCount}"));
        return $"{activeUsers}|{productsPart}";
    }
}
