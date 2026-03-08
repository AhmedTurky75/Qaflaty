using Qaflaty.Domain.Catalog.Aggregates.Country;

namespace Qaflaty.Domain.Catalog.Repositories;

public interface ICountryRepository
{
    Task<List<Country>> GetAllActiveAsync(CancellationToken ct = default);
}
