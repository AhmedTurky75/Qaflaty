using Qaflaty.Domain.Catalog.Aggregates.PageConfiguration;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Domain.Catalog.Repositories;

public interface IPageConfigurationRepository
{
    Task<PageConfiguration?> GetByIdAsync(PageConfigurationId id, CancellationToken ct = default);
    Task<PageConfiguration?> GetByStoreIdAndTypeAsync(StoreId storeId, PageType pageType, CancellationToken ct = default);
    Task<PageConfiguration?> GetByStoreIdAndSlugAsync(StoreId storeId, string slug, CancellationToken ct = default);
    Task<IReadOnlyList<PageConfiguration>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default);
    Task AddAsync(PageConfiguration page, CancellationToken ct = default);
    void Update(PageConfiguration page);
    void Delete(PageConfiguration page);
}
