using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Phone.DTOs;

namespace Qaflaty.Application.Phone.Queries.ValidatePhoneNumber;

/// <summary>Validates a phone number against a region code and returns whether it is valid plus the E.164 format.</summary>
public record ValidatePhoneNumberQuery(
    string RegionCode,
    string PhoneNumber
) : IQuery<PhoneValidationResultDto>;
