using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Storefront.Commands.SyncCart;
using Qaflaty.Application.Storefront.Queries.GetCustomerCart;

namespace Qaflaty.Api.Controllers;

[Authorize(Policy = "CustomerPolicy")]
[Route("api/storefront/cart")]
public class StorefrontCartController : ApiController
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCart(CancellationToken ct)
    {
        var customerId = CurrentUserService.CustomerId;
        if (customerId == null)
            return Unauthorized();

        var query = new GetCustomerCartQuery(customerId.Value);
        var result = await Sender.Send(query, ct);
        return HandleResult(result);
    }

    [HttpPost("sync")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SyncCart([FromBody] SyncCartRequest request, CancellationToken ct)
    {
        var customerId = CurrentUserService.CustomerId;
        if (customerId == null)
            return Unauthorized();

        var guestItems = request.GuestItems
            .Select(gi => new GuestCartItemDto(gi.ProductId, gi.VariantId, gi.Quantity))
            .ToList();

        var command = new SyncCartCommand(customerId.Value, guestItems);
        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }
}

public record SyncCartRequest(List<SyncCartItemRequest> GuestItems);
public record SyncCartItemRequest(Guid ProductId, Guid? VariantId, int Quantity);
