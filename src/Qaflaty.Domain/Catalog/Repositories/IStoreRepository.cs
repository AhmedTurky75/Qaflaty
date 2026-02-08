using Qaflaty.Domain.Catalog.Aggregates.Store;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Domain.Catalog.Repositories;

public interface IStoreRepository
{
    Task<Store?> GetByIdAsync(StoreId id, CancellationToken ct = default);
    Task<Store?> GetBySlugAsync(StoreSlug slug, CancellationToken ct = default);
    Task<Store?> GetByCustomDomainAsync(string domain, CancellationToken ct = default);
    Task<IReadOnlyList<Store>> GetByMerchantIdAsync(MerchantId merchantId, CancellationToken ct = default);
    Task<bool> IsSlugAvailableAsync(StoreSlug slug, StoreId? excludeId = null, CancellationToken ct = default);
    Task AddAsync(Store store, CancellationToken ct = default);
    void Update(Store store);
    void Delete(Store store);
}
