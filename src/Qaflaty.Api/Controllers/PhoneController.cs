using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Phone.Queries.GetAllCountryPhoneInfo;
using Qaflaty.Application.Phone.Queries.GetCountryPhoneInfo;
using Qaflaty.Application.Phone.Queries.ValidatePhoneNumber;

namespace Qaflaty.Api.Controllers;

[ApiController]
[Route("api/phone")]
public class PhoneController : ApiController
{
    /// <summary>
    /// Returns phone metadata for every supported region:
    /// region code (ISO 3166-1 alpha-2), country name, calling code,
    /// national-number regex pattern, and an example number in E.164 format.
    /// </summary>
    [HttpGet("countries")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllCountries(CancellationToken ct)
    {
        var result = await Sender.Send(new GetAllCountryPhoneInfoQuery(), ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Returns phone metadata for a single region (calling code, national-number regex, example number).
    /// </summary>
    /// <param name="regionCode">ISO 3166-1 alpha-2 region code, e.g. "SA", "EG", "AE".</param>
    [HttpGet("countries/{regionCode}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCountry(string regionCode, CancellationToken ct)
    {
        var result = await Sender.Send(new GetCountryPhoneInfoQuery(regionCode), ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Validates a phone number against the specified region.
    /// Returns whether the number is valid and, if so, its E.164 representation.
    /// </summary>
    [HttpGet("validate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Validate(
        [FromQuery] string regionCode,
        [FromQuery] string phoneNumber,
        CancellationToken ct)
    {
        var result = await Sender.Send(new ValidatePhoneNumberQuery(regionCode, phoneNumber), ct);
        return HandleResult(result);
    }
}
