using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Ordering.Commands.RejectBlockedOrder;
using Qaflaty.Application.Ordering.Commands.ReleaseBlockedOrder;

namespace Qaflaty.Api.Controllers;

/// <summary>
/// Merchant moderation for orders held against the phone blocklist.
///
/// Store access is enforced globally by StoreScopeAuthorizationFilter for every
/// api/stores/{storeId}/... route, and again inside each handler.
/// </summary>
[Authorize(Policy = "MerchantPolicy")]
[Route("api/stores/{storeId:guid}/orders/{orderId:guid}")]
public class MerchantBlockedOrdersController : ApiController
{
    /// <summary>
    /// Approves a held order. Confirming it here is what reserves stock and tracks the purchase —
    /// none of that happened at placement.
    /// </summary>
    [HttpPost("release")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReleaseBlockedOrder(
        Guid storeId,
        Guid orderId,
        [FromBody] ReleaseBlockedOrderRequest? request,
        CancellationToken ct)
    {
        var result = await Sender.Send(
            new ReleaseBlockedOrderCommand(storeId, orderId, request?.AlsoUnblockPhone ?? false), ct);

        if (result.IsFailure) return HandleResult(result);
        return NoContent();
    }

    /// <summary>Rejects a held order, cancelling it without restoring stock it never reserved.</summary>
    [HttpPost("reject")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectBlockedOrder(
        Guid storeId,
        Guid orderId,
        [FromBody] RejectBlockedOrderRequest? request,
        CancellationToken ct)
    {
        var result = await Sender.Send(
            new RejectBlockedOrderCommand(storeId, orderId, request?.Reason), ct);

        if (result.IsFailure) return HandleResult(result);
        return NoContent();
    }
}

public record ReleaseBlockedOrderRequest(bool AlsoUnblockPhone);

public record RejectBlockedOrderRequest(string? Reason);
