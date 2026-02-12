using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Storefront.Commands.AddToWishlist;
using Qaflaty.Application.Storefront.Commands.RemoveFromWishlist;
using Qaflaty.Application.Storefront.Queries.GetCustomerWishlist;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Api.Controllers;

[Authorize(Policy = "CustomerPolicy")]
[Route("api/storefront/wishlist")]
public class StorefrontWishlistController : ApiController
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetWishlist(CancellationToken ct)
    {
        var customerId = CurrentUserService.CustomerId;
        if (customerId == null)
            return Unauthorized();

        var query = new GetCustomerWishlistQuery(customerId.Value);
        var result = await Sender.Send(query, ct);
        return HandleResult(result);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AddToWishlist([FromBody] AddToWishlistRequest request, CancellationToken ct)
    {
        var customerId = CurrentUserService.CustomerId;
        if (customerId == null)
            return Unauthorized();

        var command = new AddToWishlistCommand(
            customerId.Value,
            new ProductId(request.ProductId),
            request.VariantId);

        var result = await Sender.Send(command, ct);

        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RemoveFromWishlist([FromBody] RemoveFromWishlistRequest request, CancellationToken ct)
    {
        var customerId = CurrentUserService.CustomerId;
        if (customerId == null)
            return Unauthorized();

        var command = new RemoveFromWishlistCommand(
            customerId.Value,
            new ProductId(request.ProductId),
            request.VariantId);

        var result = await Sender.Send(command, ct);

        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }
}

public record AddToWishlistRequest(Guid ProductId, Guid? VariantId);
public record RemoveFromWishlistRequest(Guid ProductId, Guid? VariantId);
