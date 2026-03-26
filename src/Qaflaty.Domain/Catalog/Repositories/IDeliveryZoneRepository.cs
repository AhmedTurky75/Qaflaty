using Qaflaty.Domain.Catalog.Aggregates.DeliveryZone;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Domain.Catalog.Repositories;

public interface IDeliveryZoneRepository
{
    Task<DeliveryZone?> GetByIdAsync(DeliveryZoneId id, CancellationToken ct = default);

    Task<IReadOnlyList<DeliveryZone>> GetByStoreAsync(StoreId storeId, CancellationToken ct = default);

    Task<DeliveryZone?> GetZoneAsync(
        StoreId storeId,
        DeliveryZoneLevel level,
        int referenceId,
        CancellationToken ct = default);

    Task AddAsync(DeliveryZone zone, CancellationToken ct = default);
    void Update(DeliveryZone zone);
    void Delete(DeliveryZone zone);
}
