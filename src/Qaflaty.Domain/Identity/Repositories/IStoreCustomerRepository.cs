using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.Aggregates.StoreCustomer;

namespace Qaflaty.Domain.Identity.Repositories;

public interface IStoreCustomerRepository
{
    Task<StoreCustomer?> GetByIdAsync(StoreCustomerId id, CancellationToken ct = default);
    Task<StoreCustomer?> GetByEmailAsync(Email email, CancellationToken ct = default);
    Task<bool> ExistsByEmailAsync(Email email, CancellationToken ct = default);
    Task AddAsync(StoreCustomer customer, CancellationToken ct = default);
    void Update(StoreCustomer customer);
    Task<CustomerRefreshToken?> GetRefreshTokenAsync(string token, CancellationToken ct = default);
}
