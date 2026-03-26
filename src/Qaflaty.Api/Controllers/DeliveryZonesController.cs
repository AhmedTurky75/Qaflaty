using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Catalog.Commands.UpsertDeliveryZone;
using Qaflaty.Application.Catalog.Queries.GetDeliveryZones;
using Qaflaty.Application.Catalog.Queries.ResolveDeliveryFee;

namespace Qaflaty.Api.Controllers;

[Route("api/stores/{storeId:guid}/delivery-zones")]
[Authorize]
public class DeliveryZonesController : ApiController
{
    [HttpGet]
    public async Task<IActionResult> GetZones(Guid storeId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetDeliveryZonesQuery(storeId), ct);
        return HandleResult(result);
    }

    [HttpPut]
    public async Task<IActionResult> UpsertZone(
        Guid storeId, [FromBody] UpsertDeliveryZoneRequest request, CancellationToken ct)
    {
        var command = new UpsertDeliveryZoneCommand(
            storeId,
            request.Level,
            request.ReferenceId,
            request.IsDeliveryEnabled,
            request.CustomDeliveryFee,
            request.FeeCurrency);

        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }

    [HttpGet("resolve")]
    [AllowAnonymous]
    public async Task<IActionResult> ResolveDeliveryFee(
        Guid storeId,
        [FromQuery] int countryId,
        [FromQuery] int? cityId,
        [FromQuery] int? districtId,
        CancellationToken ct)
    {
        var result = await Sender.Send(
            new ResolveDeliveryFeeQuery(storeId, countryId, cityId, districtId), ct);
        return HandleResult(result);
    }
}

public record UpsertDeliveryZoneRequest(
    string Level,
    int ReferenceId,
    bool IsDeliveryEnabled,
    decimal? CustomDeliveryFee,
    string? FeeCurrency);
