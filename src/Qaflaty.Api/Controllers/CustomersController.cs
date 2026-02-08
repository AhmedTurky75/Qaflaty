using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Ordering.Commands.UpdateCustomerNotes;
using Qaflaty.Application.Ordering.Queries.GetCustomerById;
using Qaflaty.Application.Ordering.Queries.GetCustomerOrders;
using Qaflaty.Application.Ordering.Queries.GetStoreCustomers;

namespace Qaflaty.Api.Controllers;

[ApiController]
[Route("api/customers")]
[Authorize]
public class CustomersController : ApiController
{
    [HttpGet]
    public async Task<IActionResult> GetCustomers(
        [FromQuery] Guid storeId,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var query = new GetStoreCustomersQuery(storeId, search, page, pageSize);
        var result = await Sender.Send(query, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetCustomerById(Guid id, CancellationToken ct)
    {
        var result = await Sender.Send(new GetCustomerByIdQuery(id), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}/orders")]
    public async Task<IActionResult> GetCustomerOrders(Guid id, CancellationToken ct)
    {
        var result = await Sender.Send(new GetCustomerOrdersQuery(id), ct);
        return Ok(result);
    }

    [HttpPut("{id:guid}/notes")]
    public async Task<IActionResult> UpdateCustomerNotes(Guid id, [FromBody] UpdateCustomerNotesRequest request, CancellationToken ct)
    {
        var result = await Sender.Send(new UpdateCustomerNotesCommand(id, request.Note), ct);
        if (result.IsFailure) return HandleResult(result);
        return NoContent();
    }
}

public record UpdateCustomerNotesRequest(string Note);
