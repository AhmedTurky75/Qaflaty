using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.DeleteDeliveryZone;

public class DeleteDeliveryZoneCommandHandler : ICommandHandler<DeleteDeliveryZoneCommand>
{
    private readonly IDeliveryZoneRepository _zoneRepository;

    public DeleteDeliveryZoneCommandHandler(IDeliveryZoneRepository zoneRepository)
    {
        _zoneRepository = zoneRepository;
    }

    public async Task<Result> Handle(DeleteDeliveryZoneCommand request, CancellationToken cancellationToken)
    {
        var zone = await _zoneRepository.GetByIdAsync(
            new DeliveryZoneId(request.ZoneId), cancellationToken);

        if (zone is null)
            return Result.Failure(CatalogErrors.DeliveryZoneNotFound);

        if (zone.StoreId != new StoreId(request.StoreId))
            return Result.Failure(CatalogErrors.DeliveryZoneNotFound);

        _zoneRepository.Delete(zone);
        return Result.Success();
    }
}
