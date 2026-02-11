using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Queries.GetStoreBySlug;

public class GetStoreBySlugQueryHandler : IQueryHandler<GetStoreBySlugQuery, StorePublicDto>
{
    private readonly IStoreRepository _storeRepository;

    public GetStoreBySlugQueryHandler(IStoreRepository storeRepository)
    {
        _storeRepository = storeRepository;
    }

    public async Task<Result<StorePublicDto>> Handle(GetStoreBySlugQuery request, CancellationToken cancellationToken)
    {
        var slugResult = StoreSlug.Create(request.Slug);
        if (slugResult.IsFailure)
            return Result.Failure<StorePublicDto>(CatalogErrors.StoreNotFound);

        var store = await _storeRepository.GetBySlugAsync(slugResult.Value, cancellationToken);
        if (store == null)
            return Result.Failure<StorePublicDto>(CatalogErrors.StoreNotFound);

        return Result.Success(new StorePublicDto(
            store.Id.Value,
            store.Slug.Value,
            store.Name.Value,
            store.Description,
            new StoreBrandingDto(
                store.Branding.LogoUrl,
                store.Branding.PrimaryColor),
            store.Status.ToString(),
            new DeliverySettingsDto(
                new MoneyDto(store.DeliverySettings.DeliveryFee.Amount, store.DeliverySettings.DeliveryFee.Currency.ToString()),
                store.DeliverySettings.FreeDeliveryThreshold != null
                    ? new MoneyDto(store.DeliverySettings.FreeDeliveryThreshold.Amount, store.DeliverySettings.FreeDeliveryThreshold.Currency.ToString())
                    : null)));
    }
}
