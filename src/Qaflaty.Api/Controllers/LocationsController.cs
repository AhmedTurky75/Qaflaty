using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Catalog.Queries.GetCities;
using Qaflaty.Application.Catalog.Queries.GetCountries;

namespace Qaflaty.Api.Controllers;

[Route("api/storefront/locations")]
public class LocationsController : ApiController
{
    [HttpGet("countries")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCountries(CancellationToken ct)
    {
        var result = await Sender.Send(new GetCountriesQuery(), ct);
        return HandleResult(result);
    }

    [HttpGet("cities")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCities([FromQuery] int countryId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetCitiesQuery(countryId), ct);
        return HandleResult(result);
    }
}
