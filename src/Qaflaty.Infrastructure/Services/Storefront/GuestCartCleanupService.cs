using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Infrastructure.Services.Storefront;

/// <summary>
/// Background service that runs a few times a day and removes guest carts that have been idle
/// beyond <see cref="GuestCartOptions.TtlDays"/> (the "GuestCart:TtlDays" config key, default 3).
/// </summary>
public class GuestCartCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly GuestCartOptions _options;
    private readonly ILogger<GuestCartCleanupService> _logger;
    // Sweep several times a day so a cart never lingers much past the TTL before it's purged.
    private static readonly TimeSpan Interval = TimeSpan.FromHours(6);

    public GuestCartCleanupService(
        IServiceScopeFactory scopeFactory,
        IOptions<GuestCartOptions> options,
        ILogger<GuestCartCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "GuestCartCleanupService started (TTL: {TtlDays} day(s))", _options.TtlDays);

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(Interval, stoppingToken);

            try
            {
                await RunCleanupAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Error during guest cart cleanup");
            }
        }
    }

    private async Task RunCleanupAsync(CancellationToken ct)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var cartRepository = scope.ServiceProvider.GetRequiredService<ICartRepository>();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

        var cutoff = DateTime.UtcNow.Subtract(_options.Ttl);
        var deleted = await cartRepository.DeleteExpiredGuestCartsAsync(cutoff, ct);
        await unitOfWork.SaveChangesAsync(ct);

        if (deleted > 0)
            _logger.LogInformation("Deleted {Count} expired guest carts (inactive since {Cutoff:yyyy-MM-dd})", deleted, cutoff);
    }
}
