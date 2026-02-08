using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ordering.Commands.ShipOrder;

public record ShipOrderCommand(Guid OrderId) : ICommand;
