using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Storefront.Enums;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Recommendations.CrossSell;

/// <summary>Highest priority: the merchant's own hand-picked cross-sell links, in their chosen order.</summary>
internal sealed class ManualCrossSellStrategy : ICrossSellStrategy
{
    private readonly IRelatedProductRepository _relatedProductRepository;

    public ManualCrossSellStrategy(IRelatedProductRepository relatedProductRepository)
    {
        _relatedProductRepository = relatedProductRepository;
    }

    public int Priority => 0;

    public async Task<IReadOnlyList<Guid>> RecommendAsync(Product source, RecommendationCandidatePool pool, CancellationToken ct)
    {
        var links = await _relatedProductRepository.GetByProductIdAsync(source.Id, ProductRelationType.CrossSell, ct);

        return links
            .Where(l => l.IsEnabled)
            .OrderBy(l => l.SortOrder)
            .Select(l => l.RelatedProductId.Value)
            .ToList();
    }
}
