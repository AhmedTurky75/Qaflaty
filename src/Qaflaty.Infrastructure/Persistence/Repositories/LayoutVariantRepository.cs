using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Catalog.Aggregates.LayoutVariant;
using Qaflaty.Domain.Catalog.Repositories;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class LayoutVariantRepository : ILayoutVariantRepository
{
    private readonly QaflatyDbContext _context;

    public LayoutVariantRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<LayoutVariant>> GetAllActiveAsync(CancellationToken ct = default)
        => await _context.LayoutVariants
            .Where(v => v.IsActive)
            .OrderBy(v => v.Type)
            .ThenBy(v => v.SortOrder)
            .ToListAsync(ct);
}
