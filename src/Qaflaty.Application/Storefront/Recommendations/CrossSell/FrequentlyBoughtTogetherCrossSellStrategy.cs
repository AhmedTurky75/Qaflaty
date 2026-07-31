using Qaflaty.Domain.Catalog.Aggregates.Product;

namespace Qaflaty.Application.Storefront.Recommendations.CrossSell;

/// <summary>
/// Falls back to products most frequently purchased in the same order as the source product,
/// ranked by co-occurrence count across historical orders. Only touches order history when the
/// manual strategy didn't already fill the quota (orders are loaded once per pool and memoized).
/// </summary>
internal sealed class FrequentlyBoughtTogetherCrossSellStrategy : ICrossSellStrategy
{
    public int Priority => 10;

    public async Task<IReadOnlyList<Guid>> RecommendAsync(Product source, RecommendationCandidatePool pool, CancellationToken ct)
    {
        var orders = await pool.GetOrdersAsync(ct);

        var coCounts = new Dictionary<Guid, int>();
        foreach (var order in orders)
        {
            if (!order.Items.Any(i => i.ProductId == source.Id))
                continue;

            foreach (var item in order.Items)
            {
                var productId = item.ProductId.Value;
                if (productId == source.Id.Value)
                    continue;

                coCounts[productId] = coCounts.GetValueOrDefault(productId) + item.Quantity;
            }
        }

        return coCounts
            .OrderByDescending(kv => kv.Value)
            .Select(kv => kv.Key)
            .ToList();
    }
}
