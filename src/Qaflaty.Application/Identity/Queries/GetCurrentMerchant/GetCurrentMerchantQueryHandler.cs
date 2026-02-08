using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Exceptions;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Identity.DTOs;
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

    public async Task<MerchantDto> Handle(GetCurrentMerchantQuery request, CancellationToken cancellationToken)
    {
        if (_currentUserService.MerchantId == null)
            throw new NotFoundException("Merchant", "current");

        var merchant = await _merchantRepository.GetByIdAsync(_currentUserService.MerchantId.Value, cancellationToken);
        if (merchant == null)
            throw new NotFoundException("Merchant", _currentUserService.MerchantId.Value);

        return new MerchantDto(
            merchant.Id.Value,
            merchant.Email.Value,
            merchant.FullName.Value,
            merchant.Phone?.Value,
            merchant.IsVerified,
            merchant.CreatedAt);
    }
}
