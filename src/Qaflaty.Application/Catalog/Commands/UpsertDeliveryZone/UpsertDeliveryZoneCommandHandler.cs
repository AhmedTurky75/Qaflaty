using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Aggregates.DeliveryZone;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.UpsertDeliveryZone;

public class UpsertDeliveryZoneCommandHandler : ICommandHandler<UpsertDeliveryZoneCommand, DeliveryZoneDto>
{
    private readonly IDeliveryZoneRepository _zoneRepository;

    public UpsertDeliveryZoneCommandHandler(IDeliveryZoneRepository zoneRepository)
    {
        _zoneRepository = zoneRepository;
    }

    public async Task<Result<DeliveryZoneDto>> Handle(
        UpsertDeliveryZoneCommand request, CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<DeliveryZoneLevel>(request.Level, true, out var level))
            return Result.Failure<DeliveryZoneDto>(
                new Error("DeliveryZone.InvalidLevel",
                    $"Invalid zone level '{request.Level}'. Use Country, City, or District."));

        var storeId = new StoreId(request.StoreId);
        var existing = await _zoneRepository.GetZoneAsync(storeId, level, request.ReferenceId, cancellationToken);

        DeliveryZone zone;

        if (existing != null)
        {
            var updateResult = existing.Update(request.IsDeliveryEnabled, request.CustomDeliveryFee);
            if (updateResult.IsFailure)
                return Result.Failure<DeliveryZoneDto>(updateResult.Error);

            _zoneRepository.Update(existing);
            zone = existing;
        }
        else
        {
            var createResult = DeliveryZone.Create(
                storeId, level, request.ReferenceId,
                request.IsDeliveryEnabled, request.CustomDeliveryFee);

            if (createResult.IsFailure)
                return Result.Failure<DeliveryZoneDto>(createResult.Error);

            await _zoneRepository.AddAsync(createResult.Value, cancellationToken);
            zone = createResult.Value;
        }

        return Result.Success(MapToDto(zone));
    }

    private static DeliveryZoneDto MapToDto(DeliveryZone z) =>
        new(z.Id.Value, z.StoreId.Value, z.Level.ToString(), z.ReferenceId,
            z.IsDeliveryEnabled, z.CustomDeliveryFee);
}
