using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Recommendations.GetMostViewedProducts;

public class GetMostViewedProductsQueryHandler
    : IQueryHandler<GetMostViewedProductsQuery, IReadOnlyList<ProductPublicDto>>
{
    private readonly IProductViewRepository _viewRepository;
    private readonly IProductRepository _productRepository;

    public GetMostViewedProductsQueryHandler(
        IProductViewRepository viewRepository,
        IProductRepository productRepository)
    {
        _viewRepository = viewRepository;
        _productRepository = productRepository;
    }

    public async Task<Result<IReadOnlyList<ProductPublicDto>>> Handle(
        GetMostViewedProductsQuery request, CancellationToken ct)
    {
        var since = request.Days.HasValue
            ? DateTime.UtcNow.AddDays(-request.Days.Value)
            : DateTime.UnixEpoch;

        // Over-fetch so inactive/deleted products can be filtered out.
        var ids = await _viewRepository.GetMostViewedProductIdsAsync(
            request.StoreId, since, request.Take * 3, ct);

        if (ids.Count == 0)
            return Result.Success<IReadOnlyList<ProductPublicDto>>([]);

        var storeProducts = await _productRepository.GetByStoreIdAsync(request.StoreId, ct);
        var byId = storeProducts
            .Where(p => p.Status == ProductStatus.Active)
            .ToDictionary(p => p.Id.Value);

        var result = ids
            .Where(byId.ContainsKey)
            .Take(request.Take)
            .Select(id => ProductRecommendationMapper.Map(byId[id]))
            .ToList();

        return Result.Success<IReadOnlyList<ProductPublicDto>>(result);
    }
}
