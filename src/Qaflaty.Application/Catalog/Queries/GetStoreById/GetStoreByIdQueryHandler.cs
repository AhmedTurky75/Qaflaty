using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetStoreById;

public class GetStoreByIdQueryHandler : IQueryHandler<GetStoreByIdQuery, StoreDto>
{
    private readonly IStoreRepository _storeRepository;

    public GetStoreByIdQueryHandler(IStoreRepository storeRepository)
    {
        _storeRepository = storeRepository;
    }

    public async Task<Result<StoreDto>> Handle(GetStoreByIdQuery request, CancellationToken cancellationToken)
    {
        var store = await _storeRepository.GetByIdAsync(StoreId.From(request.StoreId), cancellationToken);
        if (store == null)
            return Result.Failure<StoreDto>(CatalogErrors.StoreNotFound);

        return Result.Success(new StoreDto(
            store.Id.Value,
            store.MerchantId.Value,
            store.Slug.Value,
            store.Name.Value,
            store.Description,
            new StoreBrandingDto(store.Branding.LogoUrl, store.Branding.PrimaryColor),
            store.Status.ToString(),
            new DeliverySettingsDto(
                new MoneyDto(store.DeliverySettings.DeliveryFee.Amount),
                store.DeliverySettings.FreeDeliveryThreshold != null
                    ? new MoneyDto(store.DeliverySettings.FreeDeliveryThreshold.Amount)
                    : null),
            store.CustomDomain,
            store.CreatedAt,
            store.UpdatedAt));
    }
}
