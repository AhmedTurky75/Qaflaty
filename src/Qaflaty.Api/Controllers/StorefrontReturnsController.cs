using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Ordering.Commands.RequestGuestReturn;
using Qaflaty.Application.Ordering.Commands.RequestReturn;
using Qaflaty.Application.Ordering.DTOs;

namespace Qaflaty.Api.Controllers;

[ApiController]
[Route("api/storefront/returns")]
public class StorefrontReturnsController : ApiController
{
    private readonly ITenantContext _tenantContext;

    public StorefrontReturnsController(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    /// <summary>Open a return for a delivered order as a signed-in customer.</summary>
    [HttpPost]
    [Authorize(Policy = "CustomerPolicy")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RequestReturn([FromBody] RequestReturnRequest request, CancellationToken ct)
    {
        var command = new RequestReturnCommand(
            request.OrderNumber,
            (request.Items ?? []).Select(i => new ReturnItemSelection(i.ProductId, i.Quantity)).ToList(),
            request.Reason);

        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Open a return as a guest, authorized by the email/phone used on the order.</summary>
    [HttpPost("guest")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RequestGuestReturn([FromBody] RequestGuestReturnRequest request, CancellationToken ct)
    {
        if (!_tenantContext.IsResolved || _tenantContext.CurrentStoreId == null)
            return NotFound(new { error = "Store.NotResolved", message = "Store context not resolved" });

        var command = new RequestGuestReturnCommand(
            _tenantContext.CurrentStoreId.Value,
            request.OrderNumber,
            request.Contact,
            (request.Items ?? []).Select(i => new ReturnItemSelection(i.ProductId, i.Quantity)).ToList(),
            request.Reason);

        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }
}

public record ReturnItemRequest(Guid ProductId, int Quantity);

public record RequestReturnRequest(string OrderNumber, List<ReturnItemRequest>? Items, string Reason);

public record RequestGuestReturnRequest(
    string OrderNumber, string Contact, List<ReturnItemRequest>? Items, string Reason);
