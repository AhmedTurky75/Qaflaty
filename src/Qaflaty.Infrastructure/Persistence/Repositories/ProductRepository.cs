using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly QaflatyDbContext _context;

    public ProductRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<Product?> GetByIdAsync(ProductId id, CancellationToken ct = default)
        => await _context.Products.FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<Product?> GetBySlugAsync(StoreId storeId, ProductSlug slug, CancellationToken ct = default)
        => await _context.Products.FirstOrDefaultAsync(p => p.StoreId == storeId && p.Slug.Value == slug.Value, ct);

    public async Task<IReadOnlyList<Product>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default)
        => await _context.Products.Where(p => p.StoreId == storeId).ToListAsync(ct);

    public async Task<bool> IsSlugAvailableAsync(StoreId storeId, ProductSlug slug, ProductId? excludeId = null, CancellationToken ct = default)
    {
        var query = _context.Products.Where(p => p.StoreId == storeId && p.Slug.Value == slug.Value);
        if (excludeId.HasValue)
            query = query.Where(p => p.Id != excludeId.Value);
        return !await query.AnyAsync(ct);
    }

    public async Task AddAsync(Product product, CancellationToken ct = default)
        => await _context.Products.AddAsync(product, ct);

    public void Update(Product product)
        => _context.Products.Update(product);

    public void Delete(Product product)
        => _context.Products.Remove(product);
}
