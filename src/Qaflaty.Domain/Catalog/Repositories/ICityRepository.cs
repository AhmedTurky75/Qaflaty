using Qaflaty.Domain.Catalog.Aggregates.City;

namespace Qaflaty.Domain.Catalog.Repositories;

public interface ICityRepository
{
    Task<List<City>> GetByCountryAsync(int countryId, CancellationToken ct = default);
}
