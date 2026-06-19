using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Storefront.Recommendations.GetRelatedProducts;

/// <summary>
/// Automatic related-products engine. Scores candidates from the same store by:
/// same category, then number of shared property values. Falls back to newest
/// active products to fill the requested count.
/// </summary>
public class GetRelatedProductsQueryHandler
    : IQueryHandler<GetRelatedProductsQuery, IReadOnlyList<ProductPublicDto>>
{
    private readonly IProductRepository _productRepository;

    public GetRelatedProductsQueryHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<Result<IReadOnlyList<ProductPublicDto>>> Handle(
        GetRelatedProductsQuery request, CancellationToken ct)
    {
        var target = await _productRepository.GetByIdWithPropertyValuesAsync(request.ProductId, ct);
        if (target is null)
            return Result.Success<IReadOnlyList<ProductPublicDto>>([]);

        var candidates = await _productRepository.GetByStoreIdWithPropertyValuesAsync(target.StoreId, ct);

        var targetProps = target.PropertyValues
            .Select(v => (v.DefinitionId, v.Value))
            .ToHashSet();

        var ranked = candidates
            .Where(p => p.Status == ProductStatus.Active && p.Id != target.Id)
            .Select(p => new { Product = p, Score = Score(p, target, targetProps) })
            .OrderByDescending(x => x.Score)
            .ThenByDescending(x => x.Product.CreatedAt)
            .Take(request.Take)
            .Select(x => ProductRecommendationMapper.Map(x.Product))
            .ToList();

        return Result.Success<IReadOnlyList<ProductPublicDto>>(ranked);
    }

    private static int Score(
        Product candidate,
        Product target,
        HashSet<(Domain.Common.Identifiers.ProductPropertyDefinitionId, string)> targetProps)
    {
        var score = 0;

        if (candidate.CategoryId is not null && target.CategoryId is not null
            && candidate.CategoryId.Value == target.CategoryId.Value)
            score += 100;

        var shared = candidate.PropertyValues.Count(v => targetProps.Contains((v.DefinitionId, v.Value)));
        score += shared * 10;

        return score;
    }
}
