using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Api.Common;

/// <summary>
/// Global authorization filter that enforces tenant isolation on every
/// <c>api/stores/{storeId}/...</c> route. The merchant access token is store-less
/// (it carries a <c>merchant_id</c> but no <c>store_id</c>/<c>role</c> claim), so
/// ownership cannot be checked from claims alone. This filter loads the store named
/// in the route and rejects the request unless its <c>MerchantId</c> matches the
/// caller's <c>merchant_id</c> — i.e. the caller is the store's owner.
/// </summary>
/// <remarks>
/// The filter only acts when a <c>storeId</c> route value is present and the caller
/// is an authenticated merchant, so it has no effect on non-store-scoped routes,
/// customer/storefront routes, or unauthenticated requests — those are handled by the
/// standard <c>[Authorize]</c> policies, which run in the authorization middleware
/// before this filter.
/// </remarks>
public sealed class StoreScopeAuthorizationFilter : IAsyncAuthorizationFilter
{
    private readonly IStoreRepository _storeRepository;

    public StoreScopeAuthorizationFilter(IStoreRepository storeRepository)
    {
        _storeRepository = storeRepository;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        // Not a store-scoped route — nothing to enforce.
        if (!context.RouteData.Values.TryGetValue("storeId", out var routeStoreIdValue)
            || routeStoreIdValue is null
            || !Guid.TryParse(routeStoreIdValue.ToString(), out var routeStoreId))
        {
            return;
        }

        var user = context.HttpContext.User;

        // Let the standard [Authorize] pipeline handle unauthenticated requests.
        if (user.Identity?.IsAuthenticated != true)
            return;

        // Only merchant tokens carry merchant_id. A non-merchant (e.g. customer) token
        // can never own a store; defer to the endpoint's [Authorize] policy to reject it.
        var merchantIdClaim = user.FindFirst("merchant_id");
        if (merchantIdClaim is null || !Guid.TryParse(merchantIdClaim.Value, out var merchantId))
            return;

        var store = await _storeRepository.GetByIdAsync(new StoreId(routeStoreId));

        // Store missing or owned by someone else → the caller is not the owner.
        // Returning 403 (rather than 404) also avoids leaking which store ids exist.
        if (store is null || store.MerchantId.Value != merchantId)
        {
            context.Result = new ObjectResult(new
            {
                error = "Identity.StoreAccessDenied",
                message = "You do not have access to this store."
            })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
        }
    }
}
