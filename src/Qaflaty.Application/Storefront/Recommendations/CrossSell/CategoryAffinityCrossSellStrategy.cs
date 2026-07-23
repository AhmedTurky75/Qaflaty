using Qaflaty.Domain.Catalog.Aggregates.Product;

namespace Qaflaty.Application.Storefront.Recommendations.CrossSell;

/// <summary>Last-resort fallback: same-category / shared-attribute products, newest first.</summary>
internal sealed class CategoryAffinityCrossSellStrategy : ICrossSellStrategy
{
    public int Priority => 20;

    public Task<IReadOnlyList<Guid>> RecommendAsync(Product source, RecommendationCandidatePool pool, CancellationToken ct)
    {
        var sourceProps = CategoryAffinityScorer.BuildPropertySet(source);

        IReadOnlyList<Guid> ranked = pool.ActiveProducts
            .Where(p => p.Id != source.Id)
            .Select(p => new { Product = p, Score = CategoryAffinityScorer.Score(p, source, sourceProps) })
            .Where(x => x.Score > 0) // only genuine affinity, never "everything else"
            .OrderByDescending(x => x.Score)
            .ThenByDescending(x => x.Product.CreatedAt)
            .Select(x => x.Product.Id.Value)
            .ToList();

        return Task.FromResult(ranked);
    }
}
