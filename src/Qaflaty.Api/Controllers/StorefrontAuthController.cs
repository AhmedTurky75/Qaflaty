using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Identity.Commands.LoginStoreCustomer;
using Qaflaty.Application.Identity.Commands.RegisterStoreCustomer;
using Qaflaty.Application.Identity.Commands.UpdateCustomerProfile;
using Qaflaty.Application.Identity.Queries.GetCurrentCustomer;

namespace Qaflaty.Api.Controllers;

[Route("api/storefront/auth")]
public class StorefrontAuthController : ApiController
{
    [HttpPost("register")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterCustomerRequest request, CancellationToken ct)
    {
        var command = new RegisterStoreCustomerCommand(request.Email, request.Password, request.FullName, request.Phone);
        var result = await Sender.Send(command, ct);

        if (result.IsFailure)
            return HandleResult(result);

        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Login([FromBody] LoginCustomerRequest request, CancellationToken ct)
    {
        var command = new LoginStoreCustomerCommand(request.Email, request.Password);
        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }

    [Authorize(Policy = "CustomerPolicy")]
    [HttpGet("me")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCurrentCustomer(CancellationToken ct)
    {
        var result = await Sender.Send(new GetCurrentCustomerQuery(), ct);
        return HandleResult(result);
    }

    [Authorize(Policy = "CustomerPolicy")]
    [HttpPut("profile")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateCustomerProfileRequest request, CancellationToken ct)
    {
        var customerId = CurrentUserService.CustomerId;
        if (customerId == null)
            return Unauthorized();

        var command = new UpdateCustomerProfileCommand(customerId.Value, request.FullName, request.Phone);
        var result = await Sender.Send(command, ct);

        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }
}

public record RegisterCustomerRequest(string Email, string Password, string FullName, string? Phone);
public record LoginCustomerRequest(string Email, string Password);
public record UpdateCustomerProfileRequest(string FullName, string? Phone);
