using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Storefront.Recommendations.UpSell;

/// <summary>
/// Runs the registered <see cref="IUpSellStrategy"/> chain in priority order, merging and
/// de-duplicating results, enforcing that every candidate is a genuine (strictly more expensive)
/// upgrade, and stopping as soon as enough eligible candidates are found.
/// </summary>
internal sealed class CompositeUpSellStrategy : IUpSellRecommendationService
{
    private readonly IReadOnlyList<IUpSellStrategy> _strategies;
    private readonly IProductRepository _productRepository;
    private readonly IOrderRepository _orderRepository;

    public CompositeUpSellStrategy(
        IEnumerable<IUpSellStrategy> strategies,
        IProductRepository productRepository,
        IOrderRepository orderRepository)
    {
        _strategies = strategies.OrderBy(s => s.Priority).ToList();
        _productRepository = productRepository;
        _orderRepository = orderRepository;
    }

    public async Task<IReadOnlyList<Product>> RecommendForProductAsync(
        Product source, IReadOnlyCollection<Guid> alreadyExcluded, bool excludeOutOfStock, int take, CancellationToken ct)
    {
        var pool = await LoadPoolAsync(source.StoreId, ct);
        return await RankAsync(source, pool, alreadyExcluded, excludeOutOfStock, take, ct);
    }

    public async Task<IReadOnlyList<Product>> RecommendForCartAsync(
        StoreId storeId,
        IReadOnlyList<Product> cartLineProducts,
        IReadOnlyCollection<Guid> alreadyExcluded,
        bool excludeOutOfStock,
        int take,
        CancellationToken ct)
    {
        if (cartLineProducts.Count == 0)
            return [];

        var pool = await LoadPoolAsync(storeId, ct);

        var frequency = new Dictionary<Guid, int>();
        var byId = new Dictionary<Guid, Product>();

        foreach (var lineProduct in cartLineProducts)
        {
            var perLine = await RankAsync(lineProduct, pool, alreadyExcluded, excludeOutOfStock, take, ct);
            foreach (var product in perLine)
            {
                frequency[product.Id.Value] = frequency.GetValueOrDefault(product.Id.Value) + 1;
                byId.TryAdd(product.Id.Value, product);
            }
        }

        return frequency
            .OrderByDescending(kv => kv.Value)
            .Select(kv => byId[kv.Key])
            .Take(take)
            .ToList();
    }

    private async Task<RecommendationCandidatePool> LoadPoolAsync(StoreId storeId, CancellationToken ct)
    {
        var storeProducts = await _productRepository.GetByStoreIdWithPropertyValuesAsync(storeId, ct);
        return new RecommendationCandidatePool(storeProducts, _orderRepository, storeId);
    }

    private async Task<IReadOnlyList<Product>> RankAsync(
        Product source,
        RecommendationCandidatePool pool,
        IReadOnlyCollection<Guid> alreadyExcluded,
        bool excludeOutOfStock,
        int take,
        CancellationToken ct)
    {
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

                if (!RecommendationEligibilityPolicy.IsEligible(product, sourceIds, alreadyExcluded, excludeOutOfStock))
                    continue;

                // An upsell must be a genuine upgrade — never show a cheaper (or same-priced)
                // product, even if a merchant manually linked it by mistake.
                if (EffectivePriceCalculator.GetEffectivePrice(product) <= sourcePrice)
                    continue;

                results.Add(product);
            }
        }

        return results;
    }
}
