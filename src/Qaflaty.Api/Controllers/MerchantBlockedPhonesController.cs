using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Ordering.Commands.BlockPhone;
using Qaflaty.Application.Ordering.Commands.BlockPhoneFromCustomer;
using Qaflaty.Application.Ordering.Commands.BlockPhoneFromOrder;
using Qaflaty.Application.Ordering.Commands.UnblockPhone;
using Qaflaty.Application.Ordering.Queries.GetBlockedPhones;

namespace Qaflaty.Api.Controllers;

/// <summary>
/// Manages the per-store phone blocklist. Orders placed from a blocked number are still created,
/// but park in Blocked for the merchant to release or reject rather than confirming.
///
/// Store access is enforced globally by StoreScopeAuthorizationFilter for every
/// api/stores/{storeId}/... route, and again inside each handler.
/// </summary>
[Authorize(Policy = "MerchantPolicy")]
[Route("api/stores/{storeId:guid}/blocked-phones")]
public class MerchantBlockedPhonesController : ApiController
{
    /// <summary>Lists blocked numbers for the store, newest first.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetBlockedPhones(
        Guid storeId,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(new GetBlockedPhonesQuery(storeId, search, page, pageSize), ct);
        return HandleResult(result);
    }

    /// <summary>Blocks a number the merchant entered manually.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> BlockPhone(
        Guid storeId,
        [FromBody] BlockPhoneRequest request,
        CancellationToken ct)
    {
        var result = await Sender.Send(
            new BlockPhoneCommand(storeId, request.Phone, request.CountryCode, request.Reason), ct);

        return HandleResult(result);
    }

    /// <summary>
    /// Blocks the number behind an order — the action offered from the orders table. The phone is
    /// resolved server-side from the order, so a caller cannot block an arbitrary number.
    /// </summary>
    [HttpPost("from-order/{orderId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> BlockPhoneFromOrder(
        Guid storeId,
        Guid orderId,
        [FromBody] BlockPhoneFromOrderRequest? request,
        CancellationToken ct)
    {
        var result = await Sender.Send(
            new BlockPhoneFromOrderCommand(storeId, orderId, request?.Reason), ct);

        return HandleResult(result);
    }

    /// <summary>
    /// Blocks a customer's number from the customer pages. Store-wide: every future order from the
    /// number is held, not just one. The phone is resolved server-side from the customer.
    /// </summary>
    [HttpPost("from-customer/{customerId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> BlockPhoneFromCustomer(
        Guid storeId,
        Guid customerId,
        [FromBody] BlockPhoneFromCustomerRequest? request,
        CancellationToken ct)
    {
        var result = await Sender.Send(
            new BlockPhoneFromCustomerCommand(storeId, customerId, request?.Reason), ct);

        return HandleResult(result);
    }

    /// <summary>Lifts a block so the number can order normally again.</summary>
    [HttpDelete("{blockedPhoneId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UnblockPhone(Guid storeId, Guid blockedPhoneId, CancellationToken ct)
    {
        var result = await Sender.Send(new UnblockPhoneCommand(storeId, blockedPhoneId), ct);
        if (result.IsFailure) return HandleResult(result);
        return NoContent();
    }
}

public record BlockPhoneRequest(string Phone, string CountryCode, string? Reason);

public record BlockPhoneFromOrderRequest(string? Reason);

public record BlockPhoneFromCustomerRequest(string? Reason);
