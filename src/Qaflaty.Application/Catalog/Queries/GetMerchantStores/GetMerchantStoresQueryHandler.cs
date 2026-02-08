using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Identity.Errors;

namespace Qaflaty.Application.Catalog.Queries.GetMerchantStores;

public class GetMerchantStoresQueryHandler : IQueryHandler<GetMerchantStoresQuery, List<StoreListDto>>
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

    public async Task<List<StoreListDto>> Handle(GetMerchantStoresQuery request, CancellationToken cancellationToken)
    {
        if (_currentUserService.MerchantId == null)
            throw new UnauthorizedAccessException(IdentityErrors.MerchantNotFound.Message);

        var stores = await _storeRepository.GetByMerchantIdAsync(_currentUserService.MerchantId.Value, cancellationToken);

        return stores.Select(s => new StoreListDto(
            s.Id.Value,
            s.Slug.Value,
            s.Name.Value,
            s.Status.ToString(),
            s.CreatedAt
        )).ToList();
    }
}
