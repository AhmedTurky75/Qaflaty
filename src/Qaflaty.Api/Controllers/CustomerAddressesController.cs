using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Catalog.Queries.ResolveDeliveryFee;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Identity.Commands.AddCustomerAddress;
using Qaflaty.Application.Identity.Commands.EditCustomerAddress;
using Qaflaty.Application.Identity.Commands.RemoveCustomerAddress;
using Qaflaty.Application.Identity.Queries.GetCustomerAddresses;

namespace Qaflaty.Api.Controllers;

[Route("api/storefront/addresses")]
public class CustomerAddressesController : ApiController
{
    private readonly ITenantContext _tenantContext;

    public CustomerAddressesController(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }
    [HttpGet]
    [Authorize(Policy = "CustomerPolicy")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAddresses(CancellationToken ct)
    {
        var result = await Sender.Send(new GetCustomerAddressesQuery(), ct);
        return HandleResult(result);
    }

    [HttpGet("delivery-fee")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ResolveDeliveryFee(
        [FromQuery] int countryCode,
        [FromQuery] int? cityId,
        [FromQuery] int? districtId,
        CancellationToken ct)
    {
        if (!_tenantContext.IsResolved || _tenantContext.CurrentStoreId == null)
            return BadRequest("Store context not resolved");

        var result = await Sender.Send(
            new ResolveDeliveryFeeQuery(_tenantContext.CurrentStoreId.Value.Value, countryCode, cityId, districtId), ct);
        return HandleResult(result);
    }

    [HttpPost]
    [Authorize(Policy = "CustomerPolicy")]
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
            request.IsDefault,
            request.Latitude,
            request.Longitude,
            request.CountryCode,
            request.CityId,
            request.DistrictId);

        var result = await Sender.Send(command, ct);

        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    [HttpPut("{label}")]
    [Authorize(Policy = "CustomerPolicy")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> EditAddress(string label, [FromBody] EditAddressRequest request, CancellationToken ct)
    {
        var customerId = CurrentUserService.CustomerId;
        if (customerId == null)
            return Unauthorized();

        var command = new EditCustomerAddressCommand(
            customerId.Value,
            label,
            request.Label,
            request.Street,
            request.City,
            request.State,
            request.PostalCode,
            request.Country,
            request.IsDefault,
            request.Latitude,
            request.Longitude,
            request.CountryCode,
            request.CityId,
            request.DistrictId);

        var result = await Sender.Send(command, ct);

        if (result.IsFailure)
            return HandleResult(result);

        return NoContent();
    }

    [HttpDelete("{label}")]
    [Authorize(Policy = "CustomerPolicy")]
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
    bool IsDefault,
    decimal Latitude,
    decimal Longitude,
    int CountryCode = 0,
    int? CityId = null,
    int? DistrictId = null);

public record EditAddressRequest(
    string Label,
    string Street,
    string City,
    string State,
    string PostalCode,
    string Country,
    bool IsDefault,
    decimal Latitude,
    decimal Longitude,
    int CountryCode = 0,
    int? CityId = null,
    int? DistrictId = null);
