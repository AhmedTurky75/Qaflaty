using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Storefront.Queries.GetActiveCarts;

namespace Qaflaty.Api.Controllers;

[ApiController]
[Route("api/carts")]
[Authorize]
public class CartsController : ApiController
{
    [HttpGet("active")]
    public async Task<IActionResult> GetActiveCarts(
        [FromQuery] Guid storeId,
        CancellationToken ct = default)
    {
        var query = new GetActiveCartsQuery(storeId);
        var result = await Sender.Send(query, ct);
        return HandleResult(result);
    }
}
