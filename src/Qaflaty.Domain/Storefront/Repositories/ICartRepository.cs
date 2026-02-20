using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Cart;

namespace Qaflaty.Domain.Storefront.Repositories;

public interface ICartRepository
{
    Task<Cart?> GetByCustomerIdAsync(StoreCustomerId customerId, CancellationToken ct = default);
    Task<Cart?> GetByGuestIdAsync(string guestId, StoreId storeId, CancellationToken ct = default);
    Task<List<Cart>> GetActiveCartsByStoreAsync(StoreId storeId, CancellationToken ct = default);
    Task<int> DeleteExpiredGuestCartsAsync(DateTime cutoff, CancellationToken ct = default);
    Task AddAsync(Cart cart, CancellationToken ct = default);
    void Update(Cart cart);
    void Delete(Cart cart);
}
