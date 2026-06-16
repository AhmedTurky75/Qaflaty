using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.AiInteraction;

namespace Qaflaty.Infrastructure.Persistence.Repositories.Communication;

public class AiInteractionLogRepository : IAiInteractionLogRepository
{
    private readonly QaflatyDbContext _context;

    public AiInteractionLogRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(AiInteractionLog log, CancellationToken ct = default)
        => await _context.Set<AiInteractionLog>().AddAsync(log, ct);

    public async Task AddRangeAsync(IEnumerable<AiInteractionLog> logs, CancellationToken ct = default)
        => await _context.Set<AiInteractionLog>().AddRangeAsync(logs, ct);

    public async Task<IReadOnlyList<AiInteractionLog>> GetByStoreSinceAsync(
        StoreId storeId, DateTime sinceUtc, CancellationToken ct = default)
    {
        return await _context.Set<AiInteractionLog>()
            .AsNoTracking()
            .Where(l => l.StoreId == storeId && l.CreatedAt >= sinceUtc)
            .ToListAsync(ct);
    }
}
