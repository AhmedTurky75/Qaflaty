using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Wishlist;

namespace Qaflaty.Domain.Storefront.Repositories;

public interface IWishlistRepository
{
    Task<Wishlist?> GetByCustomerIdAsync(StoreCustomerId customerId, CancellationToken ct = default);

    /// <summary>Wishlist item counts grouped by product across all customers (store scoping applied by the caller).</summary>
    Task<IReadOnlyList<(Guid ProductId, int Count)>> GetWishlistCountsByProductAsync(CancellationToken ct = default);

    Task AddAsync(Wishlist wishlist, CancellationToken ct = default);
    void Update(Wishlist wishlist);
    void Delete(Wishlist wishlist);
}
