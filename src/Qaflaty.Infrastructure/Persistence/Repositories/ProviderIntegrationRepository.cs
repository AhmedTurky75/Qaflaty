using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Ads.Aggregates.ProviderIntegration;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Ads.Repositories;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class ProviderIntegrationRepository : IProviderIntegrationRepository
{
    private readonly QaflatyDbContext _context;

    public ProviderIntegrationRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<ProviderIntegration?> GetByIdAsync(ProviderIntegrationId id, CancellationToken ct = default)
        => await _context.ProviderIntegrations.FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<ProviderIntegration?> GetByStoreAndProviderAsync(StoreId storeId, AdProvider provider, CancellationToken ct = default)
        => await _context.ProviderIntegrations.FirstOrDefaultAsync(p => p.StoreId == storeId && p.Provider == provider, ct);

    public async Task<IReadOnlyList<ProviderIntegration>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default)
        => await _context.ProviderIntegrations.Where(p => p.StoreId == storeId).ToListAsync(ct);

    public async Task AddAsync(ProviderIntegration integration, CancellationToken ct = default)
        => await _context.ProviderIntegrations.AddAsync(integration, ct);

    public void Update(ProviderIntegration integration)
        => _context.ProviderIntegrations.Update(integration);
}
