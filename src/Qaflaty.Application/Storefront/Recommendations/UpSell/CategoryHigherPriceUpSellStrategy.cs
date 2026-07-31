using Qaflaty.Domain.Catalog.Aggregates.Product;

namespace Qaflaty.Application.Storefront.Recommendations.UpSell;

/// <summary>
/// Fallback: same-category / shared-attribute products that are strictly more expensive than the
/// source, ranked by affinity score then by price ascending (closest upgrade first).
/// </summary>
internal sealed class CategoryHigherPriceUpSellStrategy : IUpSellStrategy
{
    public int Priority => 10;

    public Task<IReadOnlyList<Guid>> RecommendAsync(Product source, RecommendationCandidatePool pool, CancellationToken ct)
    {
        var sourcePrice = EffectivePriceCalculator.GetEffectivePrice(source);
        var sourceProps = CategoryAffinityScorer.BuildPropertySet(source);

        IReadOnlyList<Guid> ranked = pool.ActiveProducts
            .Where(p => p.Id != source.Id)
            .Select(p => new
            {
                Product = p,
                Price = EffectivePriceCalculator.GetEffectivePrice(p),
                Score = CategoryAffinityScorer.Score(p, source, sourceProps)
            })
            .Where(x => x.Score > 0 && x.Price > sourcePrice) // genuine affinity AND a real upgrade
            .OrderByDescending(x => x.Score)
            .ThenBy(x => x.Price) // closest/cheapest upgrade first
            .Select(x => x.Product.Id.Value)
            .ToList();

        return Task.FromResult(ranked);
    }
}
