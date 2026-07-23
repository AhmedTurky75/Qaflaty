using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.Recommendations.UpSell;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Storefront.Recommendations.GetProductUpSell;

/// <summary>
/// Product-detail-page upsell: "Upgrade Your Choice" / "Premium Alternatives". Delegates ranking
/// to the shared upsell strategy chain (manual links → category + higher-price affinity).
/// </summary>
public class GetProductUpSellQueryHandler : IQueryHandler<GetProductUpSellQuery, IReadOnlyList<ProductPublicDto>>
{
    private readonly IProductRepository _productRepository;
    private readonly IStoreConfigurationRepository _storeConfigRepository;
    private readonly IUpSellRecommendationService _recommendationService;

    public GetProductUpSellQueryHandler(
        IProductRepository productRepository,
        IStoreConfigurationRepository storeConfigRepository,
        IUpSellRecommendationService recommendationService)
    {
        _productRepository = productRepository;
        _storeConfigRepository = storeConfigRepository;
        _recommendationService = recommendationService;
    }

    public async Task<Result<IReadOnlyList<ProductPublicDto>>> Handle(
        GetProductUpSellQuery request, CancellationToken ct)
    {
        var source = await _productRepository.GetByIdWithPropertyValuesAsync(request.ProductId, ct);
        if (source is null)
            return Result.Success<IReadOnlyList<ProductPublicDto>>([]);

        var config = await _storeConfigRepository.GetByStoreIdAsync(source.StoreId, ct);
        if (config is not null && !config.UpSellEnabled)
            return Result.Success<IReadOnlyList<ProductPublicDto>>([]);

        var take = config is { UpSellLimit: > 0 } ? Math.Min(request.Take, config.UpSellLimit) : request.Take;
        var excludeOutOfStock = config?.UpSellExcludeOutOfStock ?? true;

        var recommendations = await _recommendationService.RecommendForProductAsync(
            source, alreadyExcluded: [], excludeOutOfStock, take, ct);

        return Result.Success<IReadOnlyList<ProductPublicDto>>(
            recommendations.Select(ProductRecommendationMapper.Map).ToList());
    }
}
