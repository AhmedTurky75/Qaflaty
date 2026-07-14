using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Qaflaty.Application.Analytics;
using Qaflaty.Application.Analytics.Abstractions;
using Qaflaty.Application.Common.Interfaces;

namespace Qaflaty.Infrastructure.Services.Analytics;

/// <summary>
/// Periodically reclaims expired presence entries and pushes updated live-metrics to merchants
/// whose store counts changed. <see cref="IPresenceTracker"/> and <see cref="IRealtimeNotifier"/>
/// are both singletons, so — unlike <c>TrackingRetryWorker</c> — no <c>IServiceScopeFactory</c>
/// scope is needed here; nothing touches the database.
/// </summary>
public class PresenceSweeper : BackgroundService
{
    private readonly IPresenceTracker _presenceTracker;
    private readonly IRealtimeNotifier _realtimeNotifier;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ILogger<PresenceSweeper> _logger;

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
                var changedStores = await _presenceTracker.SweepExpiredAsync(now, stoppingToken);

                foreach (var storeId in changedStores)
                {
                    var activeUsers = await _presenceTracker.GetActiveUserCountAsync(storeId, now, stoppingToken);
                    var productViewers = await _presenceTracker.GetProductViewerCountsAsync(storeId, now, stoppingToken);

                    await _realtimeNotifier.NotifyPresenceChangedAsync(storeId, activeUsers, productViewers, stoppingToken);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Error during presence sweep");
            }
        }
    }
}
