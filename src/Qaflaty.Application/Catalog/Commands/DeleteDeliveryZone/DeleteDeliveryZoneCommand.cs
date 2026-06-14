using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.DeleteDeliveryZone;

public record DeleteDeliveryZoneCommand(Guid StoreId, Guid ZoneId) : ICommand;
