using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Catalog.Aggregates.FaqItem;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class FaqItemRepository : IFaqItemRepository
{
    private readonly QaflatyDbContext _context;

    public FaqItemRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<FaqItem?> GetByIdAsync(FaqItemId id, CancellationToken ct = default)
        => await _context.FaqItems.FirstOrDefaultAsync(f => f.Id == id, ct);

    public async Task<IReadOnlyList<FaqItem>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default)
        => await _context.FaqItems
            .Where(f => f.StoreId == storeId)
            .OrderBy(f => f.SortOrder)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<FaqItem>> GetPublishedByStoreIdAsync(StoreId storeId, CancellationToken ct = default)
        => await _context.FaqItems
            .Where(f => f.StoreId == storeId && f.IsPublished)
            .OrderBy(f => f.SortOrder)
            .ToListAsync(ct);

    public async Task<int> GetMaxSortOrderAsync(StoreId storeId, CancellationToken ct = default)
    {
        var maxOrder = await _context.FaqItems
            .Where(f => f.StoreId == storeId)
            .MaxAsync(f => (int?)f.SortOrder, ct);
        return maxOrder ?? -1;
    }

    public async Task AddAsync(FaqItem faq, CancellationToken ct = default)
        => await _context.FaqItems.AddAsync(faq, ct);

    public void Update(FaqItem faq)
        => _context.FaqItems.Update(faq);

    public void Delete(FaqItem faq)
        => _context.FaqItems.Remove(faq);
}
