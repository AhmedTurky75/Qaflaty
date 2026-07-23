using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Enums;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Recommendations.GetRelatedProducts;

/// <summary>
/// Related-products engine. When the store uses manual mode and the product has
/// curated links, those are returned (in merchant order). Otherwise it falls back
/// to an automatic score: same category, then shared property values, then newest.
/// </summary>
public class GetRelatedProductsQueryHandler
    : IQueryHandler<GetRelatedProductsQuery, IReadOnlyList<ProductPublicDto>>
{
    private readonly IProductRepository _productRepository;
    private readonly IRelatedProductRepository _relatedProductRepository;
    private readonly IStoreConfigurationRepository _storeConfigRepository;

    public GetRelatedProductsQueryHandler(
        IProductRepository productRepository,
        IRelatedProductRepository relatedProductRepository,
        IStoreConfigurationRepository storeConfigRepository)
    {
        _productRepository = productRepository;
        _relatedProductRepository = relatedProductRepository;
        _storeConfigRepository = storeConfigRepository;
    }

    public async Task<Result<IReadOnlyList<ProductPublicDto>>> Handle(
        GetRelatedProductsQuery request, CancellationToken ct)
    {
        var target = await _productRepository.GetByIdWithPropertyValuesAsync(request.ProductId, ct);
        if (target is null)
            return Result.Success<IReadOnlyList<ProductPublicDto>>([]);

        var config = await _storeConfigRepository.GetByStoreIdAsync(target.StoreId, ct);

        // Manual mode: return the merchant's curated selection when present.
        if (config is { RelatedProductsManual: true })
        {
            var links = await _relatedProductRepository.GetByProductIdAsync(
                target.Id, ProductRelationType.Related, ct);
            if (links.Count > 0)
            {
                var storeProducts = await _productRepository.GetByStoreIdAsync(target.StoreId, ct);
                var byId = storeProducts
                    .Where(p => p.Status == ProductStatus.Active)
                    .ToDictionary(p => p.Id.Value);

                var manual = links
                    .Select(l => l.RelatedProductId.Value)
                    .Where(byId.ContainsKey)
                    .Take(request.Take)
                    .Select(id => ProductRecommendationMapper.Map(byId[id]))
                    .ToList();

                return Result.Success<IReadOnlyList<ProductPublicDto>>(manual);
            }
        }

        return Result.Success(await AutomaticAsync(target, request.Take, ct));
    }

    private async Task<IReadOnlyList<ProductPublicDto>> AutomaticAsync(
        Product target, int take, CancellationToken ct)
    {
        var candidates = await _productRepository.GetByStoreIdWithPropertyValuesAsync(target.StoreId, ct);

        var targetProps = CategoryAffinityScorer.BuildPropertySet(target);

        return candidates
            .Where(p => p.Status == ProductStatus.Active && p.Id != target.Id)
            .Select(p => new { Product = p, Score = CategoryAffinityScorer.Score(p, target, targetProps) })
            .OrderByDescending(x => x.Score)
            .ThenByDescending(x => x.Product.CreatedAt)
            .Take(take)
            .Select(x => ProductRecommendationMapper.Map(x.Product))
            .ToList();
    }
}
