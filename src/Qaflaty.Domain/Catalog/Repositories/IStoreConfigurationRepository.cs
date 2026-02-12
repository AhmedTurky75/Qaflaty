using Qaflaty.Domain.Catalog.Aggregates.StoreConfiguration;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Domain.Catalog.Repositories;

public interface IStoreConfigurationRepository
{
    Task<StoreConfiguration?> GetByIdAsync(StoreConfigurationId id, CancellationToken ct = default);
    Task<StoreConfiguration?> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default);
    Task AddAsync(StoreConfiguration config, CancellationToken ct = default);
    void Update(StoreConfiguration config);
}
