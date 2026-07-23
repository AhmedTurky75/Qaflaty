using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Downsell;

namespace Qaflaty.Domain.Storefront.Repositories;

public interface IDownsellEventRepository
{
    Task AddAsync(DownsellEvent downsellEvent, CancellationToken ct = default);

    /// <summary>Events for analytics aggregation, optionally bounded to a date range.</summary>
    Task<IReadOnlyList<DownsellEvent>> GetByStoreIdAsync(
        StoreId storeId, DateTime? from, DateTime? to, CancellationToken ct = default);
}
