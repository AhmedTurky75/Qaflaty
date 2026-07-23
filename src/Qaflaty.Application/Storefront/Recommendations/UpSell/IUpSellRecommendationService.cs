using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Recommendations.UpSell;

public interface IUpSellRecommendationService
{
    /// <summary>Ranked, eligible, strictly-higher-priced upsell candidates for a single source product.</summary>
    Task<IReadOnlyList<Product>> RecommendForProductAsync(
        Product source, IReadOnlyCollection<Guid> alreadyExcluded, bool excludeOutOfStock, int take, CancellationToken ct);

    /// <summary>
    /// Ranked, eligible upsell candidates for a whole cart, scored by how many distinct cart
    /// lines recommend each candidate (ties broken by first-seen order).
    /// </summary>
    Task<IReadOnlyList<Product>> RecommendForCartAsync(
        StoreId storeId,
        IReadOnlyList<Product> cartLineProducts,
        IReadOnlyCollection<Guid> alreadyExcluded,
        bool excludeOutOfStock,
        int take,
        CancellationToken ct);
}
