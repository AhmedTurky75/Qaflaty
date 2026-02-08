using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.UpdateDeliverySettings;

public record UpdateDeliverySettingsCommand(
    Guid StoreId,
    decimal DeliveryFee,
    decimal? FreeDeliveryThreshold
) : ICommand;
