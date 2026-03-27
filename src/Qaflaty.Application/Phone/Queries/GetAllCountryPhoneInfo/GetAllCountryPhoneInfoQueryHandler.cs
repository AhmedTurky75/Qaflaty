using System.Globalization;
using PhoneNumbers;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Phone.DTOs;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Phone.Queries.GetAllCountryPhoneInfo;

public class GetAllCountryPhoneInfoQueryHandler
    : IQueryHandler<GetAllCountryPhoneInfoQuery, List<CountryPhoneInfoDto>>
{
    private static readonly PhoneNumberUtil PhoneUtil = PhoneNumberUtil.GetInstance();

    public Task<Result<List<CountryPhoneInfoDto>>> Handle(
        GetAllCountryPhoneInfoQuery request,
        CancellationToken cancellationToken)
    {
        var result = PhoneUtil.GetSupportedRegions()
            .OrderBy(r => r)
            .Select(BuildCountryInfo)
            .OfType<CountryPhoneInfoDto>()   // filters out nulls from unsupported regions
            .OrderBy(c => c.CountryName)
            .ToList();

        return Task.FromResult(Result.Success(result));
    }

    internal static CountryPhoneInfoDto? BuildCountryInfo(string regionCode)
    {
        var callingCode = PhoneUtil.GetCountryCodeForRegion(regionCode);
        var metadata    = PhoneUtil.GetMetadataForRegion(regionCode);
        if (metadata == null) return null;

        var pattern = metadata.GeneralDesc?.NationalNumberPattern ?? string.Empty;

        string exampleNumber;
        try
        {
            var example = PhoneUtil.GetExampleNumber(regionCode);
            exampleNumber = PhoneUtil.Format(example, PhoneNumberFormat.E164);
        }
        catch
        {
            exampleNumber = string.Empty;
        }

        string countryName;
        try   { countryName = new RegionInfo(regionCode).EnglishName; }
        catch { countryName = regionCode; }

        return new CountryPhoneInfoDto(regionCode, countryName, callingCode, pattern, exampleNumber);
    }
}
