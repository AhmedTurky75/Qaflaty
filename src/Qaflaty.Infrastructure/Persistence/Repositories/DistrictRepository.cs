using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Catalog.Aggregates.District;
using Qaflaty.Domain.Catalog.Repositories;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class DistrictRepository : IDistrictRepository
{
    private readonly QaflatyDbContext _context;

    public DistrictRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<District>> GetByCityAsync(int cityId, CancellationToken ct = default)
        => await _context.Districts.Where(d => d.CityId == cityId && d.IsActive).ToListAsync(ct);

    public async Task<District?> GetByIdAsync(int id, CancellationToken ct = default)
        => await _context.Districts.FirstOrDefaultAsync(d => d.Id == id, ct);
}
