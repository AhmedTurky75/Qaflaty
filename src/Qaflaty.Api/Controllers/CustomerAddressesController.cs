using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Identity.Commands.AddCustomerAddress;
using Qaflaty.Application.Identity.Commands.RemoveCustomerAddress;

namespace Qaflaty.Api.Controllers;

[Authorize(Policy = "CustomerPolicy")]
[Route("api/storefront/addresses")]
public class CustomerAddressesController : ApiController
{
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AddAddress([FromBody] AddAddressRequest request, CancellationToken ct)
    {
        var customerId = CurrentUserService.CustomerId;
        if (customerId == null)
            return Unauthorized();

        var command = new AddCustomerAddressCommand(
            customerId.Value,
            request.Label,
            request.Street,
            request.City,
            request.State,
            request.PostalCode,
            request.Country,
            request.IsDefault);

        var result = await Sender.Send(command, ct);

        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    [HttpDelete("{label}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RemoveAddress(string label, CancellationToken ct)
    {
        var customerId = CurrentUserService.CustomerId;
        if (customerId == null)
            return Unauthorized();

        var command = new RemoveCustomerAddressCommand(customerId.Value, label);
        var result = await Sender.Send(command, ct);

        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }
}

public record AddAddressRequest(
    string Label,
    string Street,
    string City,
    string State,
    string PostalCode,
    string Country,
    bool IsDefault);
