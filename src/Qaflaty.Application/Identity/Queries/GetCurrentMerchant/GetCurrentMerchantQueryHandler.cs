using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Identity.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;

namespace Qaflaty.Application.Identity.Queries.GetCurrentMerchant;

public class GetCurrentMerchantQueryHandler : IQueryHandler<GetCurrentMerchantQuery, MerchantDto>
{
    private readonly IMerchantRepository _merchantRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetCurrentMerchantQueryHandler(
        IMerchantRepository merchantRepository,
        ICurrentUserService currentUserService)
    {
        _merchantRepository = merchantRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<MerchantDto>> Handle(GetCurrentMerchantQuery request, CancellationToken cancellationToken)
    {
        if (_currentUserService.MerchantId == null)
            return Result.Failure<MerchantDto>(IdentityErrors.MerchantNotFound);

        var merchant = await _merchantRepository.GetByIdAsync(_currentUserService.MerchantId.Value, cancellationToken);
        if (merchant == null)
            return Result.Failure<MerchantDto>(IdentityErrors.MerchantNotFound);

        return Result.Success(new MerchantDto(
            merchant.Id.Value,
            merchant.Email.Value,
            merchant.FullName.Value,
            merchant.Phone?.Value,
            merchant.IsVerified,
            merchant.CreatedAt));
    }
}
