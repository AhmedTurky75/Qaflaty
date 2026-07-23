using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Common;
using Qaflaty.Application.Storefront.Commands.AddCartItem;
using Qaflaty.Application.Storefront.Commands.ClearCart;
using Qaflaty.Application.Storefront.Commands.RemoveCartItem;
using Qaflaty.Application.Storefront.Commands.SyncCart;
using Qaflaty.Application.Storefront.Commands.UpdateCartItemQuantity;
using Qaflaty.Application.Storefront.Queries.GetCustomerCart;
using Qaflaty.Application.Storefront.Recommendations.GetCartCrossSell;
using Qaflaty.Application.Storefront.Recommendations.GetCartUpSell;

namespace Qaflaty.Api.Controllers;

[Authorize(Policy = "CustomerPolicy")]
[Route("api/storefront/cart")]
public class StorefrontCartController : ApiController
{
    [HttpGet]
    public async Task<IActionResult> GetCart(CancellationToken ct)
    {
        var customerId = CurrentUserService.CustomerId;
        if (customerId == null) return Unauthorized();

        var owner = new CartOwnerContext.CustomerOwner(customerId.Value);
        var result = await Sender.Send(new GetCustomerCartQuery(owner), ct);
        return HandleResult(result);
    }

    [HttpGet("cross-sell")]
    public async Task<IActionResult> GetCrossSell([FromQuery] int take = 4, CancellationToken ct = default)
    {
        var customerId = CurrentUserService.CustomerId;
        if (customerId == null) return Unauthorized();

        var owner = new CartOwnerContext.CustomerOwner(customerId.Value);
        var result = await Sender.Send(new GetCartCrossSellQuery(owner, take), ct);
        return HandleResult(result);
    }

    [HttpGet("upsell")]
    public async Task<IActionResult> GetUpSell([FromQuery] int take = 4, CancellationToken ct = default)
    {
        var customerId = CurrentUserService.CustomerId;
        if (customerId == null) return Unauthorized();

        var owner = new CartOwnerContext.CustomerOwner(customerId.Value);
        var result = await Sender.Send(new GetCartUpSellQuery(owner, take), ct);
        return HandleResult(result);
    }

    [HttpPost("sync")]
    public async Task<IActionResult> SyncCart([FromBody] SyncCartRequest request, CancellationToken ct)
    {
        var customerId = CurrentUserService.CustomerId;
        if (customerId == null) return Unauthorized();

        var owner = new CartOwnerContext.CustomerOwner(customerId.Value);
        var guestItems = request.GuestItems
            .Select(gi => new GuestCartItemDto(gi.ProductId, gi.VariantId, gi.Quantity))
            .ToList();

        var result = await Sender.Send(new SyncCartCommand(owner, guestItems, request.GuestSessionId), ct);
        return result.IsSuccess ? NoContent() : HandleResult(result);
    }

    [HttpPost("items")]
    public async Task<IActionResult> AddItem([FromBody] CartItemRequest request, CancellationToken ct)
    {
        var customerId = CurrentUserService.CustomerId;
        if (customerId == null) return Unauthorized();

        var owner = new CartOwnerContext.CustomerOwner(customerId.Value);
        var result = await Sender.Send(
            new AddCartItemCommand(owner, request.ProductId, request.Quantity, request.VariantId), ct);

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
        var customerId = CurrentUserService.CustomerId;
        if (customerId == null) return Unauthorized();

        var owner = new CartOwnerContext.CustomerOwner(customerId.Value);
        var result = await Sender.Send(
            new UpdateCartItemQuantityCommand(owner, productId, request.Quantity, variantId), ct);

        if (result.IsFailure) return HandleResult(result);
        return NoContent();
    }

    [HttpDelete("items/{productId:guid}")]
    public async Task<IActionResult> RemoveItem(
        Guid productId,
        [FromQuery] Guid? variantId,
        CancellationToken ct)
    {
        var customerId = CurrentUserService.CustomerId;
        if (customerId == null) return Unauthorized();

        var owner = new CartOwnerContext.CustomerOwner(customerId.Value);
        var result = await Sender.Send(
            new RemoveCartItemCommand(owner, productId, variantId), ct);

        if (result.IsFailure) return HandleResult(result);
        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> ClearCart(CancellationToken ct)
    {
        var customerId = CurrentUserService.CustomerId;
        if (customerId == null) return Unauthorized();

        var owner = new CartOwnerContext.CustomerOwner(customerId.Value);
        var result = await Sender.Send(new ClearCartCommand(owner), ct);
        if (result.IsFailure) return HandleResult(result);
        return NoContent();
    }
}

public record SyncCartRequest(List<SyncCartItemRequest> GuestItems, string? GuestSessionId = null);
public record SyncCartItemRequest(Guid ProductId, Guid? VariantId, int Quantity);
public record CartItemRequest(Guid ProductId, int Quantity, Guid? VariantId = null);
public record UpdateCartItemRequest(int Quantity);
