using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Downsell;

namespace Qaflaty.Domain.Storefront.Repositories;

public interface IDownsellTriggerRuleRepository
{
    Task<IReadOnlyList<DownsellTriggerRule>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default);
    Task AddAsync(DownsellTriggerRule rule, CancellationToken ct = default);
    void RemoveRange(IEnumerable<DownsellTriggerRule> rules);
}
