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

    /// <summary>
    /// Returns every store the merchant can access — those they own
    /// (<see cref="Store.MerchantId"/>) plus those they are actively assigned to via
    /// a team invitation (<c>MerchantStoreAssignment</c>).
    /// </summary>
    Task<IReadOnlyList<Store>> GetAccessibleByMerchantIdAsync(MerchantId merchantId, CancellationToken ct = default);

    /// <summary>
    /// Whether the merchant can act on the store — true if they own it or hold an
    /// active team assignment to it. Used for per-request tenant-isolation checks.
    /// </summary>
    Task<bool> CanMerchantAccessStoreAsync(MerchantId merchantId, StoreId storeId, CancellationToken ct = default);

    Task<bool> IsSlugAvailableAsync(StoreSlug slug, StoreId? excludeId = null, CancellationToken ct = default);
    Task AddAsync(Store store, CancellationToken ct = default);
    void Update(Store store);
    void Delete(Store store);
}
