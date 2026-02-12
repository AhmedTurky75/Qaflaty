using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Catalog.Aggregates.PageConfiguration;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class PageConfigurationRepository : IPageConfigurationRepository
{
    private readonly QaflatyDbContext _context;

    public PageConfigurationRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<PageConfiguration?> GetByIdAsync(PageConfigurationId id, CancellationToken ct = default)
        => await _context.PageConfigurations
            .Include(pc => pc.Sections)
            .FirstOrDefaultAsync(pc => pc.Id == id, ct);

    public async Task<PageConfiguration?> GetByStoreIdAndTypeAsync(StoreId storeId, PageType pageType, CancellationToken ct = default)
        => await _context.PageConfigurations
            .Include(pc => pc.Sections)
            .FirstOrDefaultAsync(pc => pc.StoreId == storeId && pc.PageType == pageType, ct);

    public async Task<PageConfiguration?> GetByStoreIdAndSlugAsync(StoreId storeId, string slug, CancellationToken ct = default)
        => await _context.PageConfigurations
            .Include(pc => pc.Sections)
            .FirstOrDefaultAsync(pc => pc.StoreId == storeId && pc.Slug == slug, ct);

    public async Task<IReadOnlyList<PageConfiguration>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default)
        => await _context.PageConfigurations
            .Include(pc => pc.Sections)
            .Where(pc => pc.StoreId == storeId)
            .OrderBy(pc => pc.PageType)
            .ToListAsync(ct);

    public async Task AddAsync(PageConfiguration page, CancellationToken ct = default)
        => await _context.PageConfigurations.AddAsync(page, ct);

    public void Update(PageConfiguration page)
        => _context.PageConfigurations.Update(page);

    public void Delete(PageConfiguration page)
        => _context.PageConfigurations.Remove(page);
}
