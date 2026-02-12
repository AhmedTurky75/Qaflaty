using MediatR;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Api.Common;

[ApiController]
public abstract class ApiController : ControllerBase
{
    private ISender? _sender;
    private ICurrentUserService? _currentUserService;

    protected ISender Sender => _sender ??= HttpContext.RequestServices.GetRequiredService<ISender>();
    protected ICurrentUserService CurrentUserService => _currentUserService ??= HttpContext.RequestServices.GetRequiredService<ICurrentUserService>();

    protected IActionResult HandleResult(Result result)
    {
        if (result.IsSuccess)
            return Ok();

        return MapErrorToHttpStatus(result.Error);
    }

    protected IActionResult HandleResult<T>(Result<T> result)
    {
        if (result.IsSuccess)
            return Ok(result.Value);

        return MapErrorToHttpStatus(result.Error);
    }

    private IActionResult MapErrorToHttpStatus(Error error)
    {
        var statusCode = error.Code switch
        {
            var code when code.Contains("NotFound", StringComparison.OrdinalIgnoreCase) => StatusCodes.Status404NotFound,
            var code when code.Contains("Unauthorized", StringComparison.OrdinalIgnoreCase) => StatusCodes.Status401Unauthorized,
            var code when code.Contains("Forbidden", StringComparison.OrdinalIgnoreCase) => StatusCodes.Status403Forbidden,
            var code when code.Contains("Conflict", StringComparison.OrdinalIgnoreCase) => StatusCodes.Status409Conflict,
            var code when code.Contains("AlreadyExists", StringComparison.OrdinalIgnoreCase) => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status400BadRequest
        };

        return StatusCode(statusCode, new { error = error.Code, message = error.Message });
    }
}
