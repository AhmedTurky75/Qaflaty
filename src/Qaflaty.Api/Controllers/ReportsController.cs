using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Identity.Commands.ReportAccessDenied;

namespace Qaflaty.Api.Controllers;

[Route("api/reports")]
public class ReportsController : ApiController
{
    [HttpPost("access-denied")]
    [AllowAnonymous]
    public async Task<IActionResult> ReportAccessDenied(
        [FromBody] ReportAccessDeniedRequest request,
        CancellationToken cancellationToken)
    {
        var command = new ReportAccessDeniedCommand(request.Endpoint);
        var result = await Sender.Send(command, cancellationToken);
        return HandleResult(result);
    }
}

public record ReportAccessDeniedRequest(string Endpoint);
