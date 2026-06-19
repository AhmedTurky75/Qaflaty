using Qaflaty.Domain.Common.Identifiers;
using ProductViewEntity = Qaflaty.Domain.Storefront.Aggregates.ProductView.ProductView;

namespace Qaflaty.Domain.Storefront.Repositories;

public interface IProductViewRepository
{
    Task AddAsync(ProductViewEntity view, CancellationToken ct = default);

    /// <summary>Product ids ordered by view count (most viewed first) since the given time.</summary>
    Task<IReadOnlyList<Guid>> GetMostViewedProductIdsAsync(
        StoreId storeId, DateTime since, int take, CancellationToken ct = default);

    /// <summary>Distinct product ids most recently viewed by a customer or guest session, newest first.</summary>
    Task<IReadOnlyList<Guid>> GetRecentlyViewedProductIdsAsync(
        StoreId storeId, StoreCustomerId? customerId, string? sessionId, int take, CancellationToken ct = default);
}
