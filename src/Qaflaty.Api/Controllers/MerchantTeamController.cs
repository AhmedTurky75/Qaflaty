using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Identity.Commands.AdminResetPassword;
using Qaflaty.Application.Identity.Commands.InviteTeamMember;
using Qaflaty.Application.Identity.Commands.RemoveTeamMember;
using Qaflaty.Application.Identity.Commands.UpdateTeamMemberRole;
using Qaflaty.Application.Identity.Queries.GetTeamMember;
using Qaflaty.Application.Identity.Queries.GetTeamMembers;
using Qaflaty.Domain.Identity.Enums;

namespace Qaflaty.Api.Controllers;

[Authorize(Policy = "MerchantPolicy")]
[Route("api/stores/{storeId:guid}/team")]
public class MerchantTeamController : ApiController
{
    /// <summary>
    /// Get all team members for a store. Requires Admin or Owner.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "AdminOrAbove")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetTeam(Guid storeId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetTeamMembersQuery(storeId), ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Get a single team member by their merchant ID. Requires Admin or Owner.
    /// </summary>
    [HttpGet("{memberId:guid}")]
    [Authorize(Policy = "AdminOrAbove")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetMember(Guid storeId, Guid memberId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetTeamMemberQuery(storeId, memberId), ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Invite (create) a new merchant account and assign them to the store. Requires Owner.
    /// </summary>
    [HttpPost("invite")]
    [Authorize(Policy = "OwnerPolicy")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Invite(Guid storeId, [FromBody] InviteTeamMemberRequest request, CancellationToken ct)
    {
        var command = new InviteTeamMemberCommand(
            storeId,
            request.Email,
            request.Password,
            request.FirstName,
            request.LastName,
            request.Username,
            request.Phone,
            request.PhoneCountryCode,
            request.Role);

        var result = await Sender.Send(command, ct);

        if (result.IsFailure)
            return HandleResult(result);

        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    /// <summary>
    /// Update a team member's role in the store. Requires Owner.
    /// </summary>
    [HttpPatch("{memberId:guid}/role")]
    [Authorize(Policy = "OwnerPolicy")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateRole(Guid storeId, Guid memberId, [FromBody] UpdateTeamMemberRoleRequest request, CancellationToken ct)
    {
        var command = new UpdateTeamMemberRoleCommand(storeId, memberId, request.NewRole);
        var result = await Sender.Send(command, ct);

        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    /// <summary>
    /// Remove a team member's store assignment (deactivate). Requires Owner.
    /// </summary>
    [HttpDelete("{memberId:guid}")]
    [Authorize(Policy = "OwnerPolicy")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Remove(Guid storeId, Guid memberId, CancellationToken ct)
    {
        var command = new RemoveTeamMemberCommand(storeId, memberId);
        var result = await Sender.Send(command, ct);

        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    /// <summary>
    /// Reset another team member's password. Requires Owner.
    /// </summary>
    [HttpPost("{memberId:guid}/reset-password")]
    [Authorize(Policy = "OwnerPolicy")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ResetPassword(Guid storeId, Guid memberId, [FromBody] AdminResetPasswordRequest request, CancellationToken ct)
    {
        var command = new AdminResetPasswordCommand(storeId, memberId, request.NewPassword);
        var result = await Sender.Send(command, ct);

        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }
}

public record InviteTeamMemberRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string Username,
    string? Phone,
    string? PhoneCountryCode,
    MerchantRole Role);

public record UpdateTeamMemberRoleRequest(MerchantRole NewRole);

public record AdminResetPasswordRequest(string NewPassword);
