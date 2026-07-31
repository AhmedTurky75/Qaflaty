using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Recommendations.CrossSell;

public interface ICrossSellRecommendationService
{
    /// <summary>Ranked, eligible cross-sell candidates for a single source product (product-detail page).</summary>
    Task<IReadOnlyList<Product>> RecommendForProductAsync(
        Product source, IReadOnlyCollection<Guid> alreadyExcluded, bool excludeOutOfStock, int take, CancellationToken ct);

    /// <summary>
    /// Ranked, eligible cross-sell candidates for a whole cart, scored by how many distinct
    /// cart lines recommend each candidate (ties broken by first-seen order).
    /// </summary>
    Task<IReadOnlyList<Product>> RecommendForCartAsync(
        StoreId storeId,
        IReadOnlyList<Product> cartLineProducts,
        IReadOnlyCollection<Guid> alreadyExcluded,
        bool excludeOutOfStock,
        int take,
        CancellationToken ct);
}
