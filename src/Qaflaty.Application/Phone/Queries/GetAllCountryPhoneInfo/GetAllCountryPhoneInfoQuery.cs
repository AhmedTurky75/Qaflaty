using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Phone.DTOs;

namespace Qaflaty.Application.Phone.Queries.GetAllCountryPhoneInfo;

/// <summary>Returns phone metadata for every supported region: calling code, national number regex, and an example number.</summary>
public record GetAllCountryPhoneInfoQuery : IQuery<List<CountryPhoneInfoDto>>;
