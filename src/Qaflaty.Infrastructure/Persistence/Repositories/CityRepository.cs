using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Catalog.Aggregates.City;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Infrastructure.Persistence;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class CityRepository : ICityRepository
{
    private readonly QaflatyDbContext _context;

    public CityRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<List<City>> GetByCountryAsync(int countryId, CancellationToken ct = default)
        => await _context.Cities
            .Where(c => c.CountryId == countryId && c.IsActive)
            .OrderBy(c => c.Name)
            .ToListAsync(ct);
}
