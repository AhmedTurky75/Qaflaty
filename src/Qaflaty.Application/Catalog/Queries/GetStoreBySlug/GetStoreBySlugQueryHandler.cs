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
                store.Branding.PrimaryColor,
                store.Branding.SecondaryLogoUrl,
                store.Branding.FaviconUrl,
                store.Branding.AppleTouchIconUrl,
                store.Branding.OgImageUrl,
                store.Branding.SecondaryColor),
            store.Status.ToString(),
            new DeliverySettingsDto(
                new MoneyDto(store.DeliverySettings.DeliveryFee.Amount, store.Currency.Code),
                store.DeliverySettings.FreeDeliveryThreshold != null
                    ? new MoneyDto(store.DeliverySettings.FreeDeliveryThreshold.Amount, store.Currency.Code)
                    : null),
            store.Currency.Code,
            store.Currency.Symbol));
    }
}
