using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Aggregates.Order;
using Qaflaty.Domain.Ordering.ValueObjects;

namespace Qaflaty.Domain.Ordering.Repositories;

public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(OrderId id, CancellationToken ct = default);
    Task<Order?> GetByOrderNumberAsync(StoreId storeId, OrderNumber orderNumber, CancellationToken ct = default);
    Task<IReadOnlyList<Order>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default);
    Task<IReadOnlyList<Order>> GetByCustomerIdAsync(CustomerId customerId, CancellationToken ct = default);
    Task AddAsync(Order order, CancellationToken ct = default);
    void Update(Order order);
}
