using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Storefront.Recommendations.CrossSell;

/// <summary>
/// Runs the registered <see cref="ICrossSellStrategy"/> chain in priority order, merging and
/// de-duplicating results and stopping as soon as enough eligible candidates are found. Loads the
/// store's product/order data at most once per top-level request via <see cref="RecommendationCandidatePool"/>.
/// </summary>
internal sealed class CompositeCrossSellStrategy : ICrossSellRecommendationService
{
    private readonly IReadOnlyList<ICrossSellStrategy> _strategies;
    private readonly IProductRepository _productRepository;
    private readonly IOrderRepository _orderRepository;

    public CompositeCrossSellStrategy(
        IEnumerable<ICrossSellStrategy> strategies,
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

                results.Add(product);
            }
        }

        return results;
    }
}
