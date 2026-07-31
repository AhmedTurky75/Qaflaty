using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Downsell;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class DownsellTriggerRuleRepository : IDownsellTriggerRuleRepository
{
    private readonly QaflatyDbContext _context;

    public DownsellTriggerRuleRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<DownsellTriggerRule>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default)
        => await _context.DownsellTriggerRules
            .Where(r => r.StoreId == storeId)
            .OrderBy(r => r.Priority)
            .ToListAsync(ct);

    public async Task AddAsync(DownsellTriggerRule rule, CancellationToken ct = default)
        => await _context.DownsellTriggerRules.AddAsync(rule, ct);

    public void RemoveRange(IEnumerable<DownsellTriggerRule> rules)
        => _context.DownsellTriggerRules.RemoveRange(rules);
}
