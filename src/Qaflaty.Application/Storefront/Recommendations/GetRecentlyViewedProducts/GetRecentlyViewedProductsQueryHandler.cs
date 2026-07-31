using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Recommendations.GetRecentlyViewedProducts;

public class GetRecentlyViewedProductsQueryHandler
    : IQueryHandler<GetRecentlyViewedProductsQuery, IReadOnlyList<ProductPublicDto>>
{
    private readonly IProductViewRepository _viewRepository;
    private readonly IProductRepository _productRepository;

    public GetRecentlyViewedProductsQueryHandler(
        IProductViewRepository viewRepository,
        IProductRepository productRepository)
    {
        _viewRepository = viewRepository;
        _productRepository = productRepository;
    }

    public async Task<Result<IReadOnlyList<ProductPublicDto>>> Handle(
        GetRecentlyViewedProductsQuery request, CancellationToken ct)
    {
        if (request.CustomerId is null && string.IsNullOrWhiteSpace(request.SessionId))
            return Result.Success<IReadOnlyList<ProductPublicDto>>([]);

        // Over-fetch to allow filtering inactive products while preserving order.
        var ids = await _viewRepository.GetRecentlyViewedProductIdsAsync(
            request.StoreId, request.CustomerId, request.SessionId, request.Take * 3, ct);

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
