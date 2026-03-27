using Qaflaty.Domain.Catalog.Aggregates.District;

namespace Qaflaty.Domain.Catalog.Repositories;

public interface IDistrictRepository
{
    Task<IReadOnlyList<District>> GetByCityAsync(int cityId, CancellationToken ct = default);
    Task<District?> GetByIdAsync(int id, CancellationToken ct = default);
}
