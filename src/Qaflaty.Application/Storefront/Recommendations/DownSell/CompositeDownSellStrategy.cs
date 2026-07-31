using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Storefront.Recommendations.DownSell;

/// <summary>
/// Runs the registered <see cref="IDownSellStrategy"/> chain in priority order, merging and
/// de-duplicating results, enforcing that every candidate is a genuine (strictly cheaper)
/// downgrade, and stopping as soon as enough eligible candidates are found.
/// </summary>
internal sealed class CompositeDownSellStrategy : IDownSellRecommendationService
{
    private readonly IReadOnlyList<IDownSellStrategy> _strategies;
    private readonly IProductRepository _productRepository;
    private readonly IOrderRepository _orderRepository;

    public CompositeDownSellStrategy(
        IEnumerable<IDownSellStrategy> strategies,
        IProductRepository productRepository,
        IOrderRepository orderRepository)
    {
        _strategies = strategies.OrderBy(s => s.Priority).ToList();
        _productRepository = productRepository;
        _orderRepository = orderRepository;
    }

    public async Task<IReadOnlyList<Product>> RecommendForProductAsync(
        Product source, bool excludeOutOfStock, int take, CancellationToken ct)
    {
        var storeProducts = await _productRepository.GetByStoreIdWithPropertyValuesAsync(source.StoreId, ct);
        var pool = new RecommendationCandidatePool(storeProducts, _orderRepository, source.StoreId);

        var sourceIds = new[] { source.Id.Value };
        var sourcePrice = EffectivePriceCalculator.GetEffectivePrice(source);
        var seen = new HashSet<Guid>();
        var results = new List<Product>(take);

        foreach (var strategy in _strategies)
        {
            if (results.Count >= take)
                break;

            var candidateIds = await strategy.RecommendAsync(source, pool, ct);
            foreach (var id in candidateIds)
            {
                if (results.Count >= take)
                    break;

                if (!seen.Add(id))
                    continue; // de-dupe across strategies

                if (!pool.ProductsById.TryGetValue(id, out var product))
                    continue;

                if (!RecommendationEligibilityPolicy.IsEligible(product, sourceIds, [], excludeOutOfStock))
                    continue;

                // A downsell must be a genuine downgrade — never show a same-priced or more
                // expensive product, even if a merchant manually linked it by mistake.
                if (EffectivePriceCalculator.GetEffectivePrice(product) >= sourcePrice)
                    continue;

                results.Add(product);
            }
        }

        return results;
    }
}
