using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ordering.Commands.DeliverOrder;

public record DeliverOrderCommand(Guid OrderId) : ICommand;
