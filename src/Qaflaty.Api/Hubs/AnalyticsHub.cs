using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Api.Hubs;

/// <summary>
/// SignalR Hub for real-time merchant dashboard analytics (live active users, per-product
/// viewer counts, active-cart changes). Merchant-only — unlike <see cref="ChatHub"/>, connections
/// must be authenticated, and store membership in a <c>store_{storeId}</c> group is only ever
/// granted after re-validating the caller can access that store (never trusted from the client),
/// so one merchant's dashboard can never receive another merchant's store traffic.
/// </summary>
[Authorize(Policy = "MerchantPolicy")]
public class AnalyticsHub : Hub
{
    private readonly IStoreRepository _storeRepository;
    private readonly ILogger<AnalyticsHub> _logger;

    public AnalyticsHub(IStoreRepository storeRepository, ILogger<AnalyticsHub> logger)
    {
        _storeRepository = storeRepository;
        _logger = logger;
    }

    /// <summary>Joins the caller's connection to a store's live-metrics group, after verifying they can access that store.</summary>
    public async Task Subscribe(Guid storeId)
    {
        var merchantId = GetMerchantId();
        if (merchantId is null)
        {
            await Clients.Caller.SendAsync("Error", "Not authorized");
            return;
        }

        var canAccess = await _storeRepository.CanMerchantAccessStoreAsync(merchantId.Value, new StoreId(storeId));
        if (!canAccess)
        {
            _logger.LogWarning(
                "Merchant {MerchantId} attempted to subscribe to analytics for store {StoreId} without access",
                merchantId.Value.Value, storeId);
            await Clients.Caller.SendAsync("Error", "You do not have access to this store");
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(storeId));
    }

    public async Task Unsubscribe(Guid storeId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(storeId));
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Analytics client connected: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation(
            "Analytics client disconnected: {ConnectionId}, Exception: {Exception}",
            Context.ConnectionId, exception?.Message);
        await base.OnDisconnectedAsync(exception);
    }

    internal static string GroupName(Guid storeId) => $"store_{storeId}";

    private MerchantId? GetMerchantId()
    {
        var claim = Context.User?.FindFirst("merchant_id");
        return claim != null && Guid.TryParse(claim.Value, out var id) ? new MerchantId(id) : null;
    }
}
