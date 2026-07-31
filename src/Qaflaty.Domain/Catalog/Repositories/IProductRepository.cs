using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Domain.Catalog.Repositories;

public interface IProductRepository
{
    Task<Product?> GetByIdAsync(ProductId id, CancellationToken ct = default);
    Task<Product?> GetByIdWithPropertyValuesAsync(ProductId id, CancellationToken ct = default);
    Task<Product?> GetBySlugAsync(StoreId storeId, ProductSlug slug, CancellationToken ct = default);
    Task<IReadOnlyList<Product>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default);
    Task<IReadOnlyList<Product>> GetByStoreIdWithPropertyValuesAsync(StoreId storeId, CancellationToken ct = default);
    // Variants are a separate table rather than an owned collection, so callers that read per-variant
    // stock must ask for them explicitly.
    Task<IReadOnlyList<Product>> GetByStoreIdWithVariantsAsync(StoreId storeId, CancellationToken ct = default);
    Task<bool> IsSlugAvailableAsync(StoreId storeId, ProductSlug slug, ProductId? excludeId = null, CancellationToken ct = default);
    Task AddAsync(Product product, CancellationToken ct = default);
    void Update(Product product);
    void Delete(Product product);
}
