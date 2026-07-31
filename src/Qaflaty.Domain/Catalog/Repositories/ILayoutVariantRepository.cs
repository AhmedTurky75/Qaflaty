using Qaflaty.Domain.Catalog.Aggregates.LayoutVariant;

namespace Qaflaty.Domain.Catalog.Repositories;

public interface ILayoutVariantRepository
{
    /// <summary>
    /// Returns the active layout variants across all slots, ordered by type then sort order.
    /// This is a small, global (non-tenant) catalog consumed by the store builder.
    /// </summary>
    Task<IReadOnlyList<LayoutVariant>> GetAllActiveAsync(CancellationToken ct = default);
}
