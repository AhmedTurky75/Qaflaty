using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Identity.DTOs;
using Qaflaty.Application.Identity.Services;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;
using Qaflaty.Domain.Identity.ValueObjects;

namespace Qaflaty.Application.Identity.Commands.UpdateMerchantProfile;

public class UpdateMerchantProfileCommandHandler : ICommandHandler<UpdateMerchantProfileCommand, MerchantDto>
{
    private readonly IMerchantRepository _merchantRepository;
    private readonly ICurrentUserService _currentUserService;

    public UpdateMerchantProfileCommandHandler(
        IMerchantRepository merchantRepository,
        ICurrentUserService currentUserService)
    {
        _merchantRepository = merchantRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<MerchantDto>> Handle(
        UpdateMerchantProfileCommand request,
        CancellationToken cancellationToken)
    {
        var merchantId = _currentUserService.MerchantId!;

        var merchant = await _merchantRepository.GetByIdAsync(merchantId.Value, cancellationToken);
        if (merchant == null)
            return Result.Failure<MerchantDto>(IdentityErrors.MerchantNotFound);

        var nameResult = PersonName.Create(request.FirstName, request.LastName);
        if (nameResult.IsFailure)
            return Result.Failure<MerchantDto>(nameResult.Error);

        PhoneNumber? phone = null;
        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            var phoneResult = PhoneNumber.Create(request.Phone, request.PhoneCountryCode ?? string.Empty);
            if (phoneResult.IsFailure)
                return Result.Failure<MerchantDto>(phoneResult.Error);
            phone = phoneResult.Value;
        }

        merchant.UpdateProfile(nameResult.Value, phone);
        _merchantRepository.Update(merchant);

        return Result.Success(new MerchantDto(
            merchant.Id.Value,
            merchant.Email.Value,
            merchant.FullName.FirstName,
            merchant.FullName.LastName,
            merchant.FullName.FullName,
            merchant.Username,
            merchant.Phone?.Value,
            merchant.IsVerified,
            merchant.CreatedAt,
            PhoneCountryCode: merchant.Phone?.CountryCode));
    }
}
