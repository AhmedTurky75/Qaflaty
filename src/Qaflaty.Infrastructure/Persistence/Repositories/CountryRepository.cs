using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Catalog.Aggregates.Country;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Infrastructure.Persistence;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class CountryRepository : ICountryRepository
{
    private readonly QaflatyDbContext _context;

    public CountryRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<List<Country>> GetAllActiveAsync(CancellationToken ct = default)
        => await _context.Countries
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .ToListAsync(ct);
}
