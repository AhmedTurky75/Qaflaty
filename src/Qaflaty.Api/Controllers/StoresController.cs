using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Catalog.Commands.CreateStore;
using Qaflaty.Application.Catalog.Commands.DeleteStore;
using Qaflaty.Application.Catalog.Commands.UpdateDeliverySettings;
using Qaflaty.Application.Catalog.Commands.UpdateStore;
using Qaflaty.Application.Catalog.Commands.UpdateStoreBranding;
using Qaflaty.Application.Catalog.Queries.CheckSlugAvailability;
using Qaflaty.Application.Catalog.Queries.GetMerchantStores;
using Qaflaty.Application.Catalog.Queries.GetStoreById;

namespace Qaflaty.Api.Controllers;

[Route("api/stores")]
[Authorize]
public class StoresController : ApiController
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMerchantStores(CancellationToken cancellationToken)
    {
        var query = new GetMerchantStoresQuery();
        var result = await Sender.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetStoreById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetStoreByIdQuery(id);
        var result = await Sender.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateStore([FromBody] CreateStoreRequest request, CancellationToken cancellationToken)
    {
        var command = new CreateStoreCommand(
            request.Slug,
            request.Name,
            request.Description,
            request.LogoUrl,
            request.PrimaryColor,
            request.DeliveryFee,
            request.FreeDeliveryThreshold);

        var result = await Sender.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return HandleResult(result);
        }

        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateStore(Guid id, [FromBody] UpdateStoreRequest request, CancellationToken cancellationToken)
    {
        var command = new UpdateStoreCommand(id, request.Name, request.Description);
        var result = await Sender.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpPut("{id:guid}/branding")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateStoreBranding(Guid id, [FromBody] UpdateStoreBrandingRequest request, CancellationToken cancellationToken)
    {
        var command = new UpdateStoreBrandingCommand(id, request.LogoUrl, request.PrimaryColor);
        var result = await Sender.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return HandleResult(result);
        }

        return NoContent();
    }

    [HttpPut("{id:guid}/delivery")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateDeliverySettings(Guid id, [FromBody] UpdateDeliverySettingsRequest request, CancellationToken cancellationToken)
    {
        var command = new UpdateDeliverySettingsCommand(id, request.DeliveryFee, request.FreeDeliveryThreshold);
        var result = await Sender.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return HandleResult(result);
        }

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteStore(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeleteStoreCommand(id);
        var result = await Sender.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            return HandleResult(result);
        }

        return NoContent();
    }

    [HttpPost("check-slug")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CheckSlugAvailability([FromBody] CheckSlugAvailabilityRequest request, CancellationToken cancellationToken)
    {
        var query = new CheckSlugAvailabilityQuery(request.Slug);
        var result = await Sender.Send(query, cancellationToken);
        return Ok(new { available = result });
    }
}

public record CreateStoreRequest(
    string Slug,
    string Name,
    string? Description,
    string? LogoUrl,
    string PrimaryColor,
    decimal DeliveryFee,
    decimal? FreeDeliveryThreshold);

public record UpdateStoreRequest(
    string Name,
    string? Description);

public record UpdateStoreBrandingRequest(
    string? LogoUrl,
    string PrimaryColor);

public record UpdateDeliverySettingsRequest(
    decimal DeliveryFee,
    decimal? FreeDeliveryThreshold);

public record CheckSlugAvailabilityRequest(string Slug);
