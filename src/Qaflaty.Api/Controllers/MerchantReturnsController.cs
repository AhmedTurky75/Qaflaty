using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Ordering.Commands.ModerateReturn;
using Qaflaty.Application.Ordering.Queries.GetStoreReturns;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Api.Controllers;

[Route("api/stores/{storeId:guid}/returns")]
[Authorize]
public class MerchantReturnsController : ApiController
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetReturns(Guid storeId, [FromQuery] string? status, CancellationToken ct)
    {
        var result = await Sender.Send(new GetStoreReturnsQuery(new StoreId(storeId), status), ct);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/approve")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Approve(
        Guid storeId, Guid id, [FromBody] ApproveReturnRequest? request, CancellationToken ct)
    {
        var result = await Sender.Send(
            new ApproveReturnCommand(new ReturnRequestId(id), new StoreId(storeId), request?.MerchantNote), ct);
        return result.IsFailure ? HandleResult(result) : NoContent();
    }

    [HttpPost("{id:guid}/reject")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reject(
        Guid storeId, Guid id, [FromBody] RejectReturnRequest request, CancellationToken ct)
    {
        var result = await Sender.Send(
            new RejectReturnCommand(new ReturnRequestId(id), new StoreId(storeId), request.Reason), ct);
        return result.IsFailure ? HandleResult(result) : NoContent();
    }

    [HttpPost("{id:guid}/refund")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Refund(Guid storeId, Guid id, CancellationToken ct)
    {
        var result = await Sender.Send(
            new RefundReturnCommand(new ReturnRequestId(id), new StoreId(storeId)), ct);
        return result.IsFailure ? HandleResult(result) : NoContent();
    }
}

public record ApproveReturnRequest(string? MerchantNote);

public record RejectReturnRequest(string Reason);
