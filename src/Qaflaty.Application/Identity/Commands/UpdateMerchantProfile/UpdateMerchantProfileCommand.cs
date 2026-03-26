using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;

namespace Qaflaty.Application.Identity.Commands.UpdateMerchantProfile;

public record UpdateMerchantProfileCommand(
    string FirstName,
    string LastName,
    string? Phone,
    string? PhoneCountryCode = null
) : ICommand<MerchantDto>;
