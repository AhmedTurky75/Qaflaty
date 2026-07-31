using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Catalog.Queries.GetLowStockItems;
using Qaflaty.Application.Ordering.Queries.GetOrderStats;
using Qaflaty.Application.Ordering.Queries.GetSalesChart;
using Qaflaty.Application.Ordering.Queries.GetStoreOrders;
using Qaflaty.Application.Ordering.Queries.GetTopProducts;

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
        return HandleResult(result);
    }

    [HttpGet("recent-orders")]
    public async Task<IActionResult> GetRecentOrders(
        [FromQuery] Guid storeId,
        [FromQuery] int count = 10,
        CancellationToken ct = default)
    {
        var query = new GetStoreOrdersQuery(storeId, null, null, 1, count);
        var result = await Sender.Send(query, ct);
        return HandleResult(result);
    }

    [HttpGet("sales-chart")]
    public async Task<IActionResult> GetSalesChart(
        [FromQuery] Guid storeId,
        [FromQuery] int days = 7,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(new GetSalesChartQuery(storeId, days), ct);
        return HandleResult(result);
    }

    [HttpGet("top-products")]
    public async Task<IActionResult> GetTopProducts(
        [FromQuery] Guid storeId,
        [FromQuery] int limit = 5,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(new GetTopProductsQuery(storeId, limit), ct);
        return HandleResult(result);
    }

    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStock(
        [FromQuery] Guid storeId,
        [FromQuery] int threshold = 10,
        CancellationToken ct = default)
    {
        var result = await Sender.Send(new GetLowStockItemsQuery(storeId, threshold), ct);
        return HandleResult(result);
    }
}
