using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.Recommendations.CrossSell;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Storefront.Recommendations.GetProductCrossSell;

/// <summary>
/// Product-detail-page cross-sell: "Frequently Bought Together" / "You May Also Like".
/// Delegates ranking to the shared strategy chain (manual links → order co-occurrence →
/// category affinity) and stops early once the store-configured limit is met.
/// </summary>
public class GetProductCrossSellQueryHandler : IQueryHandler<GetProductCrossSellQuery, IReadOnlyList<ProductPublicDto>>
{
    private readonly IProductRepository _productRepository;
    private readonly IStoreConfigurationRepository _storeConfigRepository;
    private readonly ICrossSellRecommendationService _recommendationService;

    public GetProductCrossSellQueryHandler(
        IProductRepository productRepository,
        IStoreConfigurationRepository storeConfigRepository,
        ICrossSellRecommendationService recommendationService)
    {
        _productRepository = productRepository;
        _storeConfigRepository = storeConfigRepository;
        _recommendationService = recommendationService;
    }

    public async Task<Result<IReadOnlyList<ProductPublicDto>>> Handle(
        GetProductCrossSellQuery request, CancellationToken ct)
    {
        var source = await _productRepository.GetByIdWithPropertyValuesAsync(request.ProductId, ct);
        if (source is null)
            return Result.Success<IReadOnlyList<ProductPublicDto>>([]);

        var config = await _storeConfigRepository.GetByStoreIdAsync(source.StoreId, ct);
        if (config is not null && !config.CrossSellEnabled)
            return Result.Success<IReadOnlyList<ProductPublicDto>>([]);

        var take = config is { CrossSellLimit: > 0 } ? Math.Min(request.Take, config.CrossSellLimit) : request.Take;
        var excludeOutOfStock = config?.CrossSellExcludeOutOfStock ?? true;

        var recommendations = await _recommendationService.RecommendForProductAsync(
            source, alreadyExcluded: [], excludeOutOfStock, take, ct);

        return Result.Success<IReadOnlyList<ProductPublicDto>>(
            recommendations.Select(ProductRecommendationMapper.Map).ToList());
    }
}
