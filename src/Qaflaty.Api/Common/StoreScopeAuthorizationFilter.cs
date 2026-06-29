using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Qaflaty.Api.Common;

/// <summary>
/// Global authorization filter that enforces tenant isolation on every
/// <c>api/stores/{storeId}/...</c> route. A merchant's access token carries a
/// single <c>store_id</c> claim describing the store they are currently operating
/// in; this filter rejects any request whose route <c>storeId</c> does not match
/// that claim, preventing a merchant from acting on a store they do not belong to.
/// </summary>
/// <remarks>
/// The filter only enforces when both a <c>storeId</c> route value and a
/// <c>store_id</c> claim are present, so it has no effect on non-store-scoped
/// routes, customer/storefront routes, or unauthenticated requests — those are
/// handled by the standard <c>[Authorize]</c> policies.
/// </remarks>
public sealed class StoreScopeAuthorizationFilter : IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
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

        var storeClaim = user.FindFirst("store_id");

        // No store context on the token (e.g. pre-store-selection merchant token,
        // or a customer token). Defer to the route's own [Authorize] policies,
        // which require the store-context claims for these endpoints anyway.
        if (storeClaim is null || string.IsNullOrWhiteSpace(storeClaim.Value))
            return;

        if (!Guid.TryParse(storeClaim.Value, out var tokenStoreId) || tokenStoreId != routeStoreId)
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
