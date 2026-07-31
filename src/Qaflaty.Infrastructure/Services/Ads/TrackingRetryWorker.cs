using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Domain.Ads.Repositories;

namespace Qaflaty.Infrastructure.Services.Ads;

/// <summary>
/// Drains queued dispatch retries and periodically sweeps the database for anything due
/// (<c>NextRetryAt</c> in the past) that the in-process queue missed — e.g. because the
/// process restarted between the failure and the retry. Mirrors the
/// <c>GuestCartCleanupService</c> shape: a scoped, timer/queue-driven loop over
/// <see cref="IServiceScopeFactory"/>.
/// </summary>
public class TrackingRetryWorker : BackgroundService
{
    private static readonly TimeSpan SweepInterval = TimeSpan.FromMinutes(1);
    private const int SweepBatchSize = 100;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IEventQueue _eventQueue;
    private readonly ILogger<TrackingRetryWorker> _logger;

    public TrackingRetryWorker(IServiceScopeFactory scopeFactory, IEventQueue eventQueue, ILogger<TrackingRetryWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _eventQueue = eventQueue;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("TrackingRetryWorker started");

        var consumerLoop = ConsumeQueueAsync(stoppingToken);
        var sweepLoop = SweepDueRetriesAsync(stoppingToken);

        await Task.WhenAll(consumerLoop, sweepLoop);
    }

    private async Task ConsumeQueueAsync(CancellationToken stoppingToken)
    {
        try
        {
            await foreach (var dispatch in _eventQueue.ReadAllAsync(stoppingToken))
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                var trackingEventRepository = scope.ServiceProvider.GetRequiredService<ITrackingEventRepository>();
                var eventDispatcher = scope.ServiceProvider.GetRequiredService<IEventDispatcher>();

                var trackingEvent = await trackingEventRepository.GetByIdAsync(dispatch.TrackingEventId, stoppingToken);
                var log = trackingEvent?.DispatchLogs.FirstOrDefault(l => l.Id == dispatch.DispatchLogId);
                if (log?.NextRetryAt is { } nextRetryAt)
                {
                    var delay = nextRetryAt - DateTime.UtcNow;
                    if (delay > TimeSpan.Zero)
                        await Task.Delay(delay, stoppingToken);
                }

                try
                {
                    await eventDispatcher.RedispatchAsync(dispatch.TrackingEventId, dispatch.DispatchLogId, stoppingToken);
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    _logger.LogError(ex, "Queued retry failed for dispatch {DispatchLogId}", dispatch.DispatchLogId);
                }
            }
        }
        catch (OperationCanceledException)
        {
            // graceful shutdown
        }
    }

    private async Task SweepDueRetriesAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(SweepInterval, stoppingToken);

            try
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                var trackingEventRepository = scope.ServiceProvider.GetRequiredService<ITrackingEventRepository>();
                var eventDispatcher = scope.ServiceProvider.GetRequiredService<IEventDispatcher>();

                var due = await trackingEventRepository.GetDueForRetryAsync(SweepBatchSize, stoppingToken);
                foreach (var trackingEvent in due)
                {
                    var dueLogs = trackingEvent.DispatchLogs.Where(l =>
                        l.NextRetryAt != null && l.NextRetryAt <= DateTime.UtcNow).ToList();

                    foreach (var log in dueLogs)
                    {
                        try
                        {
                            await eventDispatcher.RedispatchAsync(trackingEvent.Id, log.Id, stoppingToken);
                        }
                        catch (Exception ex) when (ex is not OperationCanceledException)
                        {
                            _logger.LogError(ex, "Swept retry failed for dispatch {DispatchLogId}", log.Id);
                        }
                    }
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Error during tracking retry sweep");
            }
        }
    }
}
