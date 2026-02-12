using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Cart;

namespace Qaflaty.Domain.Storefront.Repositories;

public interface ICartRepository
{
    Task<Cart?> GetByCustomerIdAsync(StoreCustomerId customerId, CancellationToken ct = default);
    Task AddAsync(Cart cart, CancellationToken ct = default);
    void Update(Cart cart);
    void Delete(Cart cart);
}
