using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Identity.Commands.InitiateCustomerLogin;
using Qaflaty.Application.Identity.Commands.LogoutStoreCustomer;
using Qaflaty.Application.Identity.Commands.RefreshCustomerToken;
using Qaflaty.Application.Identity.Commands.RegisterStoreCustomer;
using Qaflaty.Application.Identity.Commands.ResendCustomerLoginOtp;
using Qaflaty.Application.Identity.Commands.UpdateCustomerProfile;
using Qaflaty.Application.Identity.Commands.VerifyCustomerLoginOtp;
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
        var command = new RegisterStoreCustomerCommand(
            request.Email,
            request.Password,
            request.FirstName,
            request.LastName,
            request.Username,
            request.Phone);

        var result = await Sender.Send(command, ct);

        if (result.IsFailure)
            return HandleResult(result);

        var cookieService = HttpContext.RequestServices.GetRequiredService<ICookieAuthService>();
        cookieService.SetAuthCookies(HttpContext, result.Value.AccessToken, result.Value.RefreshToken);

        return StatusCode(StatusCodes.Status201Created, result.Value.Customer);
    }

    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Login([FromBody] LoginCustomerRequest request, CancellationToken ct)
    {
        var command = new InitiateCustomerLoginCommand(request.EmailOrUsername, request.Password);
        var result = await Sender.Send(command, ct);

        if (result.IsFailure)
            return HandleResult(result);

        if (!result.Value.RequiresOtp)
        {
            var cookieService = HttpContext.RequestServices.GetRequiredService<ICookieAuthService>();
            cookieService.SetAuthCookies(HttpContext, result.Value.AuthResponse!.AccessToken, result.Value.AuthResponse!.RefreshToken);
            return Ok(result.Value.AuthResponse!.Customer);
        }

        return Ok(new { email = result.Value.Email });
    }

    [HttpPost("verify-otp")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyCustomerOtpRequest request, CancellationToken ct)
    {
        var command = new VerifyCustomerLoginOtpCommand(request.Email, request.OtpCode);
        var result = await Sender.Send(command, ct);

        if (result.IsFailure)
            return HandleResult(result);

        var cookieService = HttpContext.RequestServices.GetRequiredService<ICookieAuthService>();
        cookieService.SetAuthCookies(HttpContext, result.Value.AccessToken, result.Value.RefreshToken);

        return Ok(result.Value.Customer);
    }

    [HttpPost("resend-otp")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResendOtp([FromBody] ResendCustomerOtpRequest request, CancellationToken ct)
    {
        var command = new ResendCustomerLoginOtpCommand(request.Email);
        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }

    [HttpPost("refresh")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RefreshToken(CancellationToken ct)
    {
        if (!HttpContext.Request.Cookies.TryGetValue("refresh_token", out var refreshToken) ||
            string.IsNullOrEmpty(refreshToken))
            return BadRequest(new { error = "Identity.InvalidRefreshToken", message = "Refresh token is missing" });

        var command = new RefreshCustomerTokenCommand(refreshToken);
        var result = await Sender.Send(command, ct);

        if (result.IsFailure)
            return HandleResult(result);

        var cookieService = HttpContext.RequestServices.GetRequiredService<ICookieAuthService>();
        cookieService.SetAuthCookies(HttpContext, result.Value.AccessToken, result.Value.RefreshToken);

        return Ok(result.Value.Customer);
    }

    [Authorize(Policy = "CustomerPolicy")]
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        if (!HttpContext.Request.Cookies.TryGetValue("refresh_token", out var refreshToken) ||
            string.IsNullOrEmpty(refreshToken))
        {
            var cookieServiceEarly = HttpContext.RequestServices.GetRequiredService<ICookieAuthService>();
            cookieServiceEarly.ClearAuthCookies(HttpContext);
            return NoContent();
        }

        var command = new LogoutStoreCustomerCommand(refreshToken);
        var result = await Sender.Send(command, ct);

        var cookieService = HttpContext.RequestServices.GetRequiredService<ICookieAuthService>();
        cookieService.ClearAuthCookies(HttpContext);

        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
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

        var command = new UpdateCustomerProfileCommand(customerId.Value, request.FirstName, request.LastName, request.Phone, request.PhoneCountryCode, request.SecondaryPhone, request.SecondaryPhoneCountryCode);
        var result = await Sender.Send(command, ct);

        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }
}

public record RegisterCustomerRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string Username,
    string? Phone);

public record LoginCustomerRequest(string EmailOrUsername, string Password);
public record VerifyCustomerOtpRequest(string Email, string OtpCode);
public record ResendCustomerOtpRequest(string Email);
public record UpdateCustomerProfileRequest(string FirstName, string LastName, string? Phone, string? SecondaryPhone = null, string? PhoneCountryCode = null, string? SecondaryPhoneCountryCode = null);
