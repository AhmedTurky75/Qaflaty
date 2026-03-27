using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class ProductPropertyDefinitionRepository : IProductPropertyDefinitionRepository
{
    private readonly QaflatyDbContext _context;

    public ProductPropertyDefinitionRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<ProductPropertyDefinition?> GetByIdAsync(
        ProductPropertyDefinitionId id, CancellationToken ct = default)
        => await _context.ProductPropertyDefinitions.FirstOrDefaultAsync(d => d.Id == id, ct);

    public async Task<IReadOnlyList<ProductPropertyDefinition>> GetByStoreAsync(
        StoreId storeId, CancellationToken ct = default)
        => await _context.ProductPropertyDefinitions
            .Where(d => d.StoreId == storeId)
            .OrderBy(d => d.SortOrder)
            .ToListAsync(ct);

    public async Task<bool> NameExistsAsync(
        StoreId storeId, string name, ProductPropertyDefinitionId? excludeId, CancellationToken ct = default)
    {
        var query = _context.ProductPropertyDefinitions
            .Where(d => d.StoreId == storeId && d.Name == name);

        if (excludeId.HasValue)
            query = query.Where(d => d.Id != excludeId.Value);

        return await query.AnyAsync(ct);
    }

    public async Task AddAsync(ProductPropertyDefinition definition, CancellationToken ct = default)
        => await _context.ProductPropertyDefinitions.AddAsync(definition, ct);

    public void Update(ProductPropertyDefinition definition)
        => _context.ProductPropertyDefinitions.Update(definition);

    public void Delete(ProductPropertyDefinition definition)
        => _context.ProductPropertyDefinitions.Remove(definition);
}
