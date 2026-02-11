using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Queries.GetMerchantStores;

public class GetMerchantStoresQueryHandler : IQueryHandler<GetMerchantStoresQuery, List<StoreDto>>
{
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetMerchantStoresQueryHandler(
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<List<StoreDto>>> Handle(GetMerchantStoresQuery request, CancellationToken cancellationToken)
    {
        if (_currentUserService.MerchantId == null)
            return Result.Failure<List<StoreDto>>(Error.Unauthorized);

        var stores = await _storeRepository.GetByMerchantIdAsync(_currentUserService.MerchantId.Value, cancellationToken);

        return Result.Success(stores.Select(s => new StoreDto(
            s.Id.Value,
            s.MerchantId.Value,
            s.Slug.Value,
            s.Name.Value,
            s.Description,
            new StoreBrandingDto(s.Branding.LogoUrl, s.Branding.PrimaryColor),
            s.Status.ToString(),
            new DeliverySettingsDto(
                new MoneyDto(s.DeliverySettings.DeliveryFee.Amount),
                s.DeliverySettings.FreeDeliveryThreshold != null
                    ? new MoneyDto(s.DeliverySettings.FreeDeliveryThreshold.Amount)
                    : null),
            s.CustomDomain,
            s.CreatedAt,
            s.UpdatedAt
        )).ToList());
    }
}
