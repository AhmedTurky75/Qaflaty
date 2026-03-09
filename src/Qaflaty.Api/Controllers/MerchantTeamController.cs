using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Identity.Commands.InviteMerchantToStore;
using Qaflaty.Application.Identity.Commands.RemoveMerchantFromStore;
using Qaflaty.Application.Identity.Commands.UpdateMerchantRole;
using Qaflaty.Application.Identity.Queries.GetStoreMerchants;
using Qaflaty.Domain.Identity.Enums;

namespace Qaflaty.Api.Controllers;

[Authorize(Policy = "MerchantPolicy")]
[Route("api/stores/{storeId}/team")]
public class MerchantTeamController : ApiController
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetTeam(Guid storeId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetStoreMerchantsQuery(storeId), ct);
        return HandleResult(result);
    }

    [HttpPost("invite")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Invite(Guid storeId, [FromBody] InviteMerchantRequest request, CancellationToken ct)
    {
        var command = new InviteMerchantToStoreCommand(storeId, request.EmailOrUsername, request.Role);
        var result = await Sender.Send(command, ct);

        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    [HttpDelete("{merchantId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Remove(Guid storeId, Guid merchantId, CancellationToken ct)
    {
        var command = new RemoveMerchantFromStoreCommand(storeId, merchantId);
        var result = await Sender.Send(command, ct);

        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    [HttpPut("{merchantId:guid}/role")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateRole(Guid storeId, Guid merchantId, [FromBody] UpdateRoleRequest request, CancellationToken ct)
    {
        var command = new UpdateMerchantRoleCommand(storeId, merchantId, request.Role);
        var result = await Sender.Send(command, ct);

        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }
}

public record InviteMerchantRequest(string EmailOrUsername, MerchantRole Role);
public record UpdateRoleRequest(MerchantRole Role);
