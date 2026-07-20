using System.Collections.Concurrent;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Qaflaty.Application.Analytics;
using Qaflaty.Application.Analytics.Abstractions;
using Qaflaty.Application.Analytics.DTOs;
using Qaflaty.Application.Common.Interfaces;

namespace Qaflaty.Infrastructure.Services.Analytics;

/// <summary>
/// Periodically reclaims expired presence entries and pushes live presence metrics to merchants —
/// but only for stores a merchant is actually watching (see <see cref="IPresenceSubscriberRegistry"/>),
/// and only when that store's numbers changed since the last tick. Stores with visitors but no
/// watching merchant cost nothing here; stores with a watcher but no change trigger no push and no
/// DB read. Product-name enrichment (the only DB work) happens per changed store via a scoped
/// service, so the push carries the full snapshot and the client never has to re-fetch.
/// </summary>
public class PresenceSweeper : BackgroundService
{
    private readonly IPresenceTracker _presenceTracker;
    private readonly IPresenceSubscriberRegistry _subscriberRegistry;
    private readonly IRealtimeNotifier _realtimeNotifier;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ILogger<PresenceSweeper> _logger;

    // Last-pushed signature per store, so we only push on an actual change.
    private readonly ConcurrentDictionary<Guid, string> _lastSignatures = new();

    public PresenceSweeper(
        IPresenceTracker presenceTracker,
        IPresenceSubscriberRegistry subscriberRegistry,
        IRealtimeNotifier realtimeNotifier,
        IServiceScopeFactory scopeFactory,
        IDateTimeProvider dateTimeProvider,
        ILogger<PresenceSweeper> logger)
    {
        _presenceTracker = presenceTracker;
        _subscriberRegistry = subscriberRegistry;
        _realtimeNotifier = realtimeNotifier;
        _scopeFactory = scopeFactory;
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

                // Memory housekeeping across all tracked stores (cheap; counts are already correct
                // at read time regardless).
                await _presenceTracker.SweepExpiredAsync(now, stoppingToken);

                var watchedStores = _subscriberRegistry.GetWatchedStoreIds();
                foreach (var storeId in watchedStores)
                {
                    var activeUsers = await _presenceTracker.GetActiveUserCountAsync(storeId, now, stoppingToken);
                    var rawProductViewers = await _presenceTracker.GetProductViewerCountsAsync(storeId, now, stoppingToken);

                    var signature = BuildSignature(activeUsers, rawProductViewers);
                    if (_lastSignatures.GetOrAdd(storeId.Value, string.Empty) == signature)
                        continue;

                    _lastSignatures[storeId.Value] = signature;

                    // Only reached when a watched store's numbers actually changed — enrich (the sole
                    // DB touch) and push the full snapshot.
                    await using var scope = _scopeFactory.CreateAsyncScope();
                    var enricher = scope.ServiceProvider.GetRequiredService<IProductViewerEnricher>();
                    var productViewers = await enricher.EnrichAsync(storeId, rawProductViewers, stoppingToken);

                    await _realtimeNotifier.NotifyPresenceChangedAsync(storeId, activeUsers, productViewers, stoppingToken);
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
