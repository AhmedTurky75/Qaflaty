using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Ordering.Queries.GetOrderStats;
using Qaflaty.Application.Ordering.Queries.GetStoreOrders;

namespace Qaflaty.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ApiController
{
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] Guid storeId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetOrderStatsQuery(storeId), ct);
        return Ok(result);
    }

    [HttpGet("recent-orders")]
    public async Task<IActionResult> GetRecentOrders(
        [FromQuery] Guid storeId,
        [FromQuery] int count = 10,
        CancellationToken ct = default)
    {
        var query = new GetStoreOrdersQuery(storeId, null, null, 1, count);
        var result = await Sender.Send(query, ct);
        return Ok(result.Items);
    }
}
