using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Domain.Catalog.Repositories;

public interface IProductPropertyDefinitionRepository
{
    Task<ProductPropertyDefinition?> GetByIdAsync(ProductPropertyDefinitionId id, CancellationToken ct = default);
    Task<IReadOnlyList<ProductPropertyDefinition>> GetByStoreAsync(StoreId storeId, CancellationToken ct = default);
    Task<bool> NameExistsAsync(StoreId storeId, string name, ProductPropertyDefinitionId? excludeId, CancellationToken ct = default);
    Task AddAsync(ProductPropertyDefinition definition, CancellationToken ct = default);
    void Update(ProductPropertyDefinition definition);
    void Delete(ProductPropertyDefinition definition);
}
