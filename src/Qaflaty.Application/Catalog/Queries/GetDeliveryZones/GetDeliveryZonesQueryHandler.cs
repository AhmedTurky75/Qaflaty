using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetDeliveryZones;

public class GetDeliveryZonesQueryHandler : IQueryHandler<GetDeliveryZonesQuery, List<DeliveryZoneDto>>
{
    private readonly IDeliveryZoneRepository _zoneRepository;

    public GetDeliveryZonesQueryHandler(IDeliveryZoneRepository zoneRepository)
    {
        _zoneRepository = zoneRepository;
    }

    public async Task<Result<List<DeliveryZoneDto>>> Handle(
        GetDeliveryZonesQuery request, CancellationToken cancellationToken)
    {
        var zones = await _zoneRepository.GetByStoreAsync(new StoreId(request.StoreId), cancellationToken);

        var dtos = zones
            .Select(z => new DeliveryZoneDto(
                z.Id.Value, z.StoreId.Value, z.Level.ToString(), z.ReferenceId,
                z.IsDeliveryEnabled, z.CustomDeliveryFee))
            .ToList();

        return Result.Success(dtos);
    }
}
