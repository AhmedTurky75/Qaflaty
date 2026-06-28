using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ordering.Commands.ShipOrder;

public record ShipOrderCommand(
    Guid OrderId,
    string? Carrier = null,
    string? TrackingNumber = null,
    string? TrackingUrl = null,
    DateTime? EstimatedDeliveryDate = null
) : ICommand;
