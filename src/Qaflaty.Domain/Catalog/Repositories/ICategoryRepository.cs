using Qaflaty.Domain.Catalog.Aggregates.Category;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Domain.Catalog.Repositories;

public interface ICategoryRepository
{
    Task<Category?> GetByIdAsync(CategoryId id, CancellationToken ct = default);
    Task<Category?> GetBySlugAsync(StoreId storeId, CategorySlug slug, CancellationToken ct = default);
    Task<IReadOnlyList<Category>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default);
    Task<IReadOnlyList<Category>> GetByParentIdAsync(CategoryId parentId, CancellationToken ct = default);
    Task<bool> IsSlugAvailableAsync(StoreId storeId, CategorySlug slug, CategoryId? excludeId = null, CancellationToken ct = default);
    Task AddAsync(Category category, CancellationToken ct = default);
    void Update(Category category);
    void Delete(Category category);
}
