using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Identity.Commands.ChangePassword;
using Qaflaty.Application.Identity.Commands.Logout;
using Qaflaty.Application.Identity.Commands.RefreshToken;
using Qaflaty.Application.Identity.Commands.Register;
using Qaflaty.Application.Identity.Commands.InitiateMerchantLogin;
using Qaflaty.Application.Identity.Commands.VerifyMerchantLoginOtp;
using Qaflaty.Application.Identity.Commands.ResendMerchantLoginOtp;
using Qaflaty.Application.Identity.DTOs;
using Qaflaty.Application.Identity.Queries.GetCurrentMerchant;
using Qaflaty.Application.Identity.Commands.SelectStore;
using Qaflaty.Application.Identity.Commands.UpdateMerchantProfile;

namespace Qaflaty.Api.Controllers;

[Route("api/auth")]
public class AuthController : ApiController
{
    [HttpPost("register")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        var command = new RegisterCommand(
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

        return StatusCode(StatusCodes.Status201Created, result.Value.Merchant);
    }

    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Login([FromBody] InitiateMerchantLoginRequest request, CancellationToken ct)
    {
        var command = new InitiateMerchantLoginCommand(request.EmailOrUsername, request.Password);
        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }

    [HttpPost("verify-otp")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyMerchantOtpRequest request, CancellationToken ct)
    {
        var command = new VerifyMerchantLoginOtpCommand(request.Email, request.OtpCode);
        var result = await Sender.Send(command, ct);

        if (result.IsFailure)
            return HandleResult(result);

        var cookieService = HttpContext.RequestServices.GetRequiredService<ICookieAuthService>();
        cookieService.SetAuthCookies(HttpContext, result.Value.AccessToken, result.Value.RefreshToken);

        return Ok(new { merchant = result.Value.Merchant, storeIds = result.Value.StoreIds });
    }

    [HttpPost("resend-otp")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResendOtp([FromBody] ResendMerchantOtpRequest request, CancellationToken ct)
    {
        var command = new ResendMerchantLoginOtpCommand(request.Email);
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

        var command = new RefreshTokenCommand(refreshToken);
        var result = await Sender.Send(command, ct);

        if (result.IsFailure)
            return HandleResult(result);

        var cookieService = HttpContext.RequestServices.GetRequiredService<ICookieAuthService>();
        cookieService.SetAuthCookies(HttpContext, result.Value.AccessToken, result.Value.RefreshToken);

        return Ok(result.Value.Merchant);
    }

    [Authorize(Policy = "MerchantPolicy")]
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

        var command = new LogoutCommand(refreshToken);
        var result = await Sender.Send(command, ct);

        var cookieService = HttpContext.RequestServices.GetRequiredService<ICookieAuthService>();
        cookieService.ClearAuthCookies(HttpContext);

        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    [Authorize(Policy = "MerchantPolicy")]
    [HttpGet("me")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCurrentMerchant(CancellationToken ct)
    {
        var result = await Sender.Send(new GetCurrentMerchantQuery(), ct);
        return HandleResult(result);
    }

    [Authorize(Policy = "MerchantPolicy")]
    [HttpPatch("me")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request, CancellationToken ct)
    {
        var command = new UpdateMerchantProfileCommand(request.FirstName, request.LastName, request.Phone);
        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }

    [Authorize(Policy = "MerchantPolicy")]
    [HttpPost("change-password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        var command = new ChangePasswordCommand(request.CurrentPassword, request.NewPassword);
        var result = await Sender.Send(command, ct);

        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    [HttpGet("csrf-token")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult GetCsrfToken()
    {
        // The antiforgery middleware automatically sets the XSRF-TOKEN cookie
        // on any response. Just return 200 to trigger cookie setting.
        return Ok();
    }
    [Authorize(Policy = "MerchantPolicy")]
    [HttpPost("select-store")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SelectStore([FromBody] SelectStoreRequest request, CancellationToken ct)
    {
        var command = new SelectStoreCommand(request.StoreId);
        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }
}

public record RegisterRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string Username,
    string? Phone);

public record InitiateMerchantLoginRequest(string EmailOrUsername, string Password);
public record VerifyMerchantOtpRequest(string Email, string OtpCode);
public record ResendMerchantOtpRequest(string Email);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public record SelectStoreRequest(Guid StoreId);
public record UpdateProfileRequest(string FirstName, string LastName, string? Phone);
