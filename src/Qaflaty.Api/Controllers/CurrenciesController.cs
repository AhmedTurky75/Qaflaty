using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.Api.Controllers;

/// <summary>
/// Serves the catalog of ISO 4217 currencies a merchant can choose from when creating a store.
/// The store currency is picked once (at creation) and then locked, so this is only needed at setup.
/// </summary>
[Route("api/currencies")]
[AllowAnonymous]
public class CurrenciesController : ApiController
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult GetCurrencies()
    {
        var currencies = Currency.All
            .Select(c => new CurrencyOptionDto(c.Code, c.Symbol, c.EnglishName, c.DecimalDigits))
            .ToList();

        return Ok(currencies);
    }
}

public record CurrencyOptionDto(string Code, string Symbol, string Name, int DecimalDigits);
