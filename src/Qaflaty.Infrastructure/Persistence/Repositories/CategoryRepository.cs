using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Catalog.Aggregates.Category;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class CategoryRepository : ICategoryRepository
{
    private readonly QaflatyDbContext _context;

    public CategoryRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<Category?> GetByIdAsync(CategoryId id, CancellationToken ct = default)
        => await _context.Categories.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<Category?> GetBySlugAsync(StoreId storeId, CategorySlug slug, CancellationToken ct = default)
        => await _context.Categories.FirstOrDefaultAsync(c => c.StoreId == storeId && c.Slug.Value == slug.Value, ct);

    public async Task<IReadOnlyList<Category>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default)
        => await _context.Categories.Where(c => c.StoreId == storeId).ToListAsync(ct);

    public async Task<IReadOnlyList<Category>> GetByParentIdAsync(CategoryId parentId, CancellationToken ct = default)
        => await _context.Categories.Where(c => c.ParentId != null && c.ParentId == parentId).ToListAsync(ct);

    public async Task<bool> IsSlugAvailableAsync(StoreId storeId, CategorySlug slug, CategoryId? excludeId = null, CancellationToken ct = default)
    {
        var query = _context.Categories.Where(c => c.StoreId == storeId && c.Slug.Value == slug.Value);
        if (excludeId.HasValue)
            query = query.Where(c => c.Id != excludeId.Value);
        return !await query.AnyAsync(ct);
    }

    public async Task AddAsync(Category category, CancellationToken ct = default)
        => await _context.Categories.AddAsync(category, ct);

    public void Update(Category category)
        => _context.Categories.Update(category);

    public void Delete(Category category)
        => _context.Categories.Remove(category);
}
