using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Domain.Catalog.Services;

public interface ISlugUniquenessChecker
{
    Task<bool> IsStoreSlugAvailableAsync(StoreSlug slug, StoreId? excludeId = null, CancellationToken ct = default);
    Task<bool> IsProductSlugAvailableAsync(StoreId storeId, ProductSlug slug, ProductId? excludeId = null, CancellationToken ct = default);
    Task<bool> IsCategorySlugAvailableAsync(StoreId storeId, CategorySlug slug, CategoryId? excludeId = null, CancellationToken ct = default);
}
