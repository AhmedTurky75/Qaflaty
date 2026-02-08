using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Ordering.Aggregates.Customer;

namespace Qaflaty.Domain.Ordering.Repositories;

public interface ICustomerRepository
{
    Task<Customer?> GetByIdAsync(CustomerId id, CancellationToken ct = default);
    Task<Customer?> GetByPhoneAsync(StoreId storeId, PhoneNumber phone, CancellationToken ct = default);
    Task<IReadOnlyList<Customer>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default);
    Task AddAsync(Customer customer, CancellationToken ct = default);
    void Update(Customer customer);
}
