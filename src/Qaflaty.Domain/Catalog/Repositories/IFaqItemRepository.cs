using Qaflaty.Domain.Catalog.Aggregates.FaqItem;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Domain.Catalog.Repositories;

public interface IFaqItemRepository
{
    Task<FaqItem?> GetByIdAsync(FaqItemId id, CancellationToken ct = default);
    Task<IReadOnlyList<FaqItem>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default);
    Task<IReadOnlyList<FaqItem>> GetPublishedByStoreIdAsync(StoreId storeId, CancellationToken ct = default);
    Task<int> GetMaxSortOrderAsync(StoreId storeId, CancellationToken ct = default);
    Task AddAsync(FaqItem faq, CancellationToken ct = default);
    void Update(FaqItem faq);
    void Delete(FaqItem faq);
}
