using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Ordering.Commands.AddOrderNote;
using Qaflaty.Application.Ordering.Commands.CancelOrder;
using Qaflaty.Application.Ordering.Commands.ConfirmOrder;
using Qaflaty.Application.Ordering.Commands.DeliverOrder;
using Qaflaty.Application.Ordering.Commands.ProcessOrder;
using Qaflaty.Application.Ordering.Commands.ShipOrder;
using Qaflaty.Application.Ordering.Queries.GetOrderById;
using Qaflaty.Application.Ordering.Queries.GetOrderStats;
using Qaflaty.Application.Ordering.Queries.GetStoreOrders;

namespace Qaflaty.Api.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize]
public class OrdersController : ApiController
{
    [HttpGet]
    public async Task<IActionResult> GetOrders(
        [FromQuery] Guid storeId,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var query = new GetStoreOrdersQuery(storeId, status, search, page, pageSize);
        var result = await Sender.Send(query, ct);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetOrderById(Guid id, CancellationToken ct)
    {
        var query = new GetOrderByIdQuery(id);
        var result = await Sender.Send(query, ct);
        return HandleResult(result);
    }

    [HttpPatch("{id:guid}/confirm")]
    public async Task<IActionResult> ConfirmOrder(Guid id, CancellationToken ct)
    {
        var result = await Sender.Send(new ConfirmOrderCommand(id), ct);
        if (result.IsFailure) return HandleResult(result);
        return NoContent();
    }

    [HttpPatch("{id:guid}/process")]
    public async Task<IActionResult> ProcessOrder(Guid id, CancellationToken ct)
    {
        var result = await Sender.Send(new ProcessOrderCommand(id), ct);
        if (result.IsFailure) return HandleResult(result);
        return NoContent();
    }

    [HttpPatch("{id:guid}/ship")]
    public async Task<IActionResult> ShipOrder(Guid id, CancellationToken ct)
    {
        var result = await Sender.Send(new ShipOrderCommand(id), ct);
        if (result.IsFailure) return HandleResult(result);
        return NoContent();
    }

    [HttpPatch("{id:guid}/deliver")]
    public async Task<IActionResult> DeliverOrder(Guid id, CancellationToken ct)
    {
        var result = await Sender.Send(new DeliverOrderCommand(id), ct);
        if (result.IsFailure) return HandleResult(result);
        return NoContent();
    }

    [HttpPatch("{id:guid}/cancel")]
    public async Task<IActionResult> CancelOrder(Guid id, [FromBody] CancelOrderRequest request, CancellationToken ct)
    {
        var result = await Sender.Send(new CancelOrderCommand(id, request.Reason), ct);
        if (result.IsFailure) return HandleResult(result);
        return NoContent();
    }

    [HttpPost("{id:guid}/notes")]
    public async Task<IActionResult> AddOrderNote(Guid id, [FromBody] AddOrderNoteRequest request, CancellationToken ct)
    {
        var result = await Sender.Send(new AddOrderNoteCommand(id, request.Note), ct);
        if (result.IsFailure) return HandleResult(result);
        return NoContent();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetOrderStats([FromQuery] Guid storeId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetOrderStatsQuery(storeId), ct);
        return HandleResult(result);
    }
}

public record CancelOrderRequest(string Reason);
public record AddOrderNoteRequest(string Note);
