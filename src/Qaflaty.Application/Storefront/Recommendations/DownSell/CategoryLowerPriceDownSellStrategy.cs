using Qaflaty.Domain.Catalog.Aggregates.Product;

namespace Qaflaty.Application.Storefront.Recommendations.DownSell;

/// <summary>
/// Fallback: same-category / shared-attribute products that are strictly cheaper than the
/// source, ranked by affinity score then by price descending (closest cheaper alternative first).
/// </summary>
internal sealed class CategoryLowerPriceDownSellStrategy : IDownSellStrategy
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
            .Where(x => x.Score > 0 && x.Price < sourcePrice) // genuine affinity AND a real downgrade
            .OrderByDescending(x => x.Score)
            .ThenByDescending(x => x.Price) // closest (least drastic) cheaper alternative first
            .Select(x => x.Product.Id.Value)
            .ToList();

        return Task.FromResult(ranked);
    }
}
