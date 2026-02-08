using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Exceptions;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;

namespace Qaflaty.Application.Catalog.Queries.GetStoreBySlug;

public class GetStoreBySlugQueryHandler : IQueryHandler<GetStoreBySlugQuery, StorePublicDto>
{
    private readonly IStoreRepository _storeRepository;

    public GetStoreBySlugQueryHandler(IStoreRepository storeRepository)
    {
        _storeRepository = storeRepository;
    }

    public async Task<StorePublicDto> Handle(GetStoreBySlugQuery request, CancellationToken cancellationToken)
    {
        var slugResult = StoreSlug.Create(request.Slug);
        if (slugResult.IsFailure)
            throw new NotFoundException("Store", request.Slug);

        var store = await _storeRepository.GetBySlugAsync(slugResult.Value, cancellationToken);
        if (store == null)
            throw new NotFoundException("Store", request.Slug);

        return new StorePublicDto(
            store.Id.Value,
            store.Name.Value,
            store.Description,
            store.Branding.LogoUrl,
            store.Branding.PrimaryColor,
            store.DeliverySettings.DeliveryFee.Amount,
            store.DeliverySettings.FreeDeliveryThreshold?.Amount);
    }
}
