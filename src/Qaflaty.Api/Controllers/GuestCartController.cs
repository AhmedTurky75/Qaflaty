using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Common;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Storefront.Commands.AddCartItem;
using Qaflaty.Application.Storefront.Commands.ClearCart;
using Qaflaty.Application.Storefront.Commands.RemoveCartItem;
using Qaflaty.Application.Storefront.Commands.UpdateCartItemQuantity;
using Qaflaty.Application.Storefront.Queries.GetCustomerCart;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Api.Controllers;

/// <summary>
/// Unauthenticated cart endpoints for anonymous (guest) shoppers.
/// Store identity is resolved by TenantMiddleware via X-Store-Slug / X-Custom-Domain headers.
/// Guest identity is provided by the caller via the X-Guest-Id header (UUID v4).
/// </summary>
[Route("api/storefront/guest-cart")]
public class GuestCartController : ApiController
{
    private ITenantContext TenantContext =>
        HttpContext.RequestServices.GetRequiredService<ITenantContext>();

    /// <summary>
    /// Validates the X-Guest-Id header and returns a <see cref="CartOwnerContext.GuestOwner"/>,
    /// or a 400 Bad Request result if the header is missing or not a valid UUID.
    /// </summary>
    private ActionResult<CartOwnerContext> BuildOwner()
    {
        var guestId = Request.Headers["X-Guest-Id"].FirstOrDefault();

        if (string.IsNullOrWhiteSpace(guestId))
            return BadRequest(new { error = "GuestCart.MissingGuestId", message = "X-Guest-Id header is required" });

        if (!Guid.TryParse(guestId, out _))
            return BadRequest(new { error = "GuestCart.InvalidGuestId", message = "X-Guest-Id must be a valid UUID" });

        if (!TenantContext.IsResolved || TenantContext.CurrentStoreId == null)
            return BadRequest(new { error = "GuestCart.StoreNotResolved", message = "Store could not be determined from request headers" });

        return new CartOwnerContext.GuestOwner(guestId, TenantContext.CurrentStoreId.Value);
    }

    [HttpGet]
    public async Task<IActionResult> GetCart(CancellationToken ct)
    {
        var ownerResult = BuildOwner();
        if (ownerResult.Result != null) return ownerResult.Result;

        var result = await Sender.Send(new GetCustomerCartQuery(ownerResult.Value!), ct);
        return HandleResult(result);
    }

    [HttpPost("items")]
    public async Task<IActionResult> AddItem([FromBody] CartItemRequest request, CancellationToken ct)
    {
        var ownerResult = BuildOwner();
        if (ownerResult.Result != null) return ownerResult.Result;

        var result = await Sender.Send(
            new AddCartItemCommand(ownerResult.Value!, request.ProductId, request.Quantity, request.VariantId), ct);

        if (result.IsFailure) return HandleResult(result);
        return NoContent();
    }

    [HttpPut("items/{productId:guid}")]
    public async Task<IActionResult> UpdateItemQuantity(
        Guid productId,
        [FromBody] UpdateCartItemRequest request,
        [FromQuery] Guid? variantId,
        CancellationToken ct)
    {
        var ownerResult = BuildOwner();
        if (ownerResult.Result != null) return ownerResult.Result;

        var result = await Sender.Send(
            new UpdateCartItemQuantityCommand(ownerResult.Value!, productId, request.Quantity, variantId), ct);

        if (result.IsFailure) return HandleResult(result);
        return NoContent();
    }

    [HttpDelete("items/{productId:guid}")]
    public async Task<IActionResult> RemoveItem(
        Guid productId,
        [FromQuery] Guid? variantId,
        CancellationToken ct)
    {
        var ownerResult = BuildOwner();
        if (ownerResult.Result != null) return ownerResult.Result;

        var result = await Sender.Send(
            new RemoveCartItemCommand(ownerResult.Value!, productId, variantId), ct);

        if (result.IsFailure) return HandleResult(result);
        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> ClearCart(CancellationToken ct)
    {
        var ownerResult = BuildOwner();
        if (ownerResult.Result != null) return ownerResult.Result;

        var result = await Sender.Send(new ClearCartCommand(ownerResult.Value!), ct);
        if (result.IsFailure) return HandleResult(result);
        return NoContent();
    }
}
