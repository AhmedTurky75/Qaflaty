using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Catalog.Aggregates.DeliveryZone;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class DeliveryZoneRepository : IDeliveryZoneRepository
{
    private readonly QaflatyDbContext _context;

    public DeliveryZoneRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<DeliveryZone?> GetByIdAsync(DeliveryZoneId id, CancellationToken ct = default)
        => await _context.DeliveryZones.FirstOrDefaultAsync(z => z.Id == id, ct);

    public async Task<IReadOnlyList<DeliveryZone>> GetByStoreAsync(StoreId storeId, CancellationToken ct = default)
        => await _context.DeliveryZones.Where(z => z.StoreId == storeId).ToListAsync(ct);

    public async Task<DeliveryZone?> GetZoneAsync(
        StoreId storeId, DeliveryZoneLevel level, int referenceId, CancellationToken ct = default)
        => await _context.DeliveryZones
            .FirstOrDefaultAsync(z => z.StoreId == storeId && z.Level == level && z.ReferenceId == referenceId, ct);

    public async Task AddAsync(DeliveryZone zone, CancellationToken ct = default)
        => await _context.DeliveryZones.AddAsync(zone, ct);

    public void Update(DeliveryZone zone)
        => _context.DeliveryZones.Update(zone);

    public void Delete(DeliveryZone zone)
        => _context.DeliveryZones.Remove(zone);
}
