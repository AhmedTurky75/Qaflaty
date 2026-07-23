using Qaflaty.Domain.Catalog.Aggregates.Product;

namespace Qaflaty.Application.Storefront.Recommendations.DownSell;

public interface IDownSellRecommendationService
{
    /// <summary>Ranked, eligible, strictly-cheaper-priced downsell alternatives for a source product.</summary>
    Task<IReadOnlyList<Product>> RecommendForProductAsync(
        Product source, bool excludeOutOfStock, int take, CancellationToken ct);
}
