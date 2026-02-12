using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Identifiers;
using StoreConfigurationEntity = Qaflaty.Domain.Catalog.Aggregates.StoreConfiguration.StoreConfiguration;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class StoreConfigurationRepository : IStoreConfigurationRepository
{
    private readonly QaflatyDbContext _context;

    public StoreConfigurationRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<StoreConfigurationEntity?> GetByIdAsync(StoreConfigurationId id, CancellationToken ct = default)
        => await _context.StoreConfigurations.FirstOrDefaultAsync(sc => sc.Id == id, ct);

    public async Task<StoreConfigurationEntity?> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default)
        => await _context.StoreConfigurations.FirstOrDefaultAsync(sc => sc.StoreId == storeId, ct);

    public async Task AddAsync(StoreConfigurationEntity config, CancellationToken ct = default)
        => await _context.StoreConfigurations.AddAsync(config, ct);

    public void Update(StoreConfigurationEntity config)
        => _context.StoreConfigurations.Update(config);
}
