using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Analytics.Queries.GetLiveMetrics;

namespace Qaflaty.Api.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize]
public class AnalyticsController : ApiController
{
    /// <summary>One-time snapshot for the merchant dashboard on load; the AnalyticsHub streams deltas afterward.</summary>
    [HttpGet("live")]
    public async Task<IActionResult> GetLiveMetrics([FromQuery] Guid storeId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetLiveMetricsQuery(storeId), ct);
        return HandleResult(result);
    }
}
