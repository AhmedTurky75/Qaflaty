using Microsoft.AspNetCore.SignalR;
using Qaflaty.Api.Hubs;
using Qaflaty.Application.Analytics.Abstractions;
using Qaflaty.Application.Analytics.DTOs;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Api.Services.Analytics;

/// <summary>
/// Implements <see cref="IRealtimeNotifier"/> over <see cref="AnalyticsHub"/>. Lives in the API
/// project (rather than Infrastructure) because it needs the concrete Hub type, which SignalR
/// Hub registration requires to stay here; Application/Infrastructure code only ever depends on
/// the abstraction. Registered as a singleton — <see cref="IHubContext{THub}"/> is itself
/// singleton-safe, and this class holds no per-request state.
/// </summary>
public class SignalRRealtimeNotifier : IRealtimeNotifier
{
    private readonly IHubContext<AnalyticsHub> _hubContext;
    private readonly ILogger<SignalRRealtimeNotifier> _logger;

    public SignalRRealtimeNotifier(IHubContext<AnalyticsHub> hubContext, ILogger<SignalRRealtimeNotifier> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task NotifyPresenceChangedAsync(
        StoreId storeId, int activeUsers, IReadOnlyList<LiveProductViewerDto> productViewers, CancellationToken ct = default)
    {
        try
        {
            await _hubContext.Clients.Group(AnalyticsHub.GroupName(storeId.Value)).SendAsync(
                "PresenceUpdated",
                new { storeId = storeId.Value, activeUsers, productViewers },
                ct);
        }
        catch (Exception ex)
        {
            // A failed push must never fail the command/sweep that triggered it.
            _logger.LogError(ex, "Failed to push PresenceUpdated for store {StoreId}", storeId.Value);
        }
    }

    public async Task NotifyActiveCartsChangedAsync(StoreId storeId, CancellationToken ct = default)
    {
        try
        {
            await _hubContext.Clients.Group(AnalyticsHub.GroupName(storeId.Value)).SendAsync(
                "ActiveCartsChanged",
                new { storeId = storeId.Value },
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to push ActiveCartsChanged for store {StoreId}", storeId.Value);
        }
    }
}
