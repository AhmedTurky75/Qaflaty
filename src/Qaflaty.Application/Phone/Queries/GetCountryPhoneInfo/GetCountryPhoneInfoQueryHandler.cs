using PhoneNumbers;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Phone.DTOs;
using Qaflaty.Application.Phone.Queries.GetAllCountryPhoneInfo;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Phone.Queries.GetCountryPhoneInfo;

public class GetCountryPhoneInfoQueryHandler
    : IQueryHandler<GetCountryPhoneInfoQuery, CountryPhoneInfoDto>
{
    private static readonly PhoneNumberUtil PhoneUtil = PhoneNumberUtil.GetInstance();

    public Task<Result<CountryPhoneInfoDto>> Handle(
        GetCountryPhoneInfoQuery request,
        CancellationToken cancellationToken)
    {
        var region = request.RegionCode.Trim().ToUpperInvariant();

        if (!PhoneUtil.GetSupportedRegions().Contains(region))
            return Task.FromResult(Result.Failure<CountryPhoneInfoDto>(
                new Error("Phone.RegionNotFound", $"Region '{region}' is not supported")));

        var info = GetAllCountryPhoneInfoQueryHandler.BuildCountryInfo(region);
        if (info == null)
            return Task.FromResult(Result.Failure<CountryPhoneInfoDto>(
                new Error("Phone.RegionNotFound", $"No phone metadata found for region '{region}'")));

        return Task.FromResult(Result.Success(info));
    }
}
