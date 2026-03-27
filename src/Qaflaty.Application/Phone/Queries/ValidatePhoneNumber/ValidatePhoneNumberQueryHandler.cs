using PhoneNumbers;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Phone.DTOs;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Phone.Queries.ValidatePhoneNumber;

public class ValidatePhoneNumberQueryHandler
    : IQueryHandler<ValidatePhoneNumberQuery, PhoneValidationResultDto>
{
    private static readonly PhoneNumberUtil PhoneUtil = PhoneNumberUtil.GetInstance();

    public Task<Result<PhoneValidationResultDto>> Handle(
        ValidatePhoneNumberQuery request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
            return Task.FromResult(Result.Success(
                new PhoneValidationResultDto(false, null, "Phone number is required")));

        var region = request.RegionCode.Trim().ToUpperInvariant();

        PhoneValidationResultDto dto;
        try
        {
            var parsed = PhoneUtil.Parse(request.PhoneNumber, region);

            if (!PhoneUtil.IsValidNumberForRegion(parsed, region))
            {
                dto = new PhoneValidationResultDto(
                    false, null,
                    $"Phone number is not valid for region '{region}'");
            }
            else
            {
                var e164 = PhoneUtil.Format(parsed, PhoneNumberFormat.E164);
                dto = new PhoneValidationResultDto(true, e164, null);
            }
        }
        catch (NumberParseException ex)
        {
            dto = new PhoneValidationResultDto(false, null, ex.Message);
        }

        return Task.FromResult(Result.Success(dto));
    }
}
