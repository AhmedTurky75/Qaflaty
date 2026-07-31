using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Downsell;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class DownsellEventRepository : IDownsellEventRepository
{
    private readonly QaflatyDbContext _context;

    public DownsellEventRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(DownsellEvent downsellEvent, CancellationToken ct = default)
        => await _context.DownsellEvents.AddAsync(downsellEvent, ct);

    public async Task<IReadOnlyList<DownsellEvent>> GetByStoreIdAsync(
        StoreId storeId, DateTime? from, DateTime? to, CancellationToken ct = default)
    {
        var query = _context.DownsellEvents.Where(e => e.StoreId == storeId);

        if (from.HasValue)
            query = query.Where(e => e.OccurredAt >= from.Value);
        if (to.HasValue)
            query = query.Where(e => e.OccurredAt <= to.Value);

        return await query.OrderByDescending(e => e.OccurredAt).ToListAsync(ct);
    }
}
