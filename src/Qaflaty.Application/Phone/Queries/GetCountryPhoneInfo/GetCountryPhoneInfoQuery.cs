using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Phone.DTOs;

namespace Qaflaty.Application.Phone.Queries.GetCountryPhoneInfo;

/// <summary>Returns phone metadata for a single region (calling code, national number regex, example).</summary>
public record GetCountryPhoneInfoQuery(string RegionCode) : IQuery<CountryPhoneInfoDto>;
