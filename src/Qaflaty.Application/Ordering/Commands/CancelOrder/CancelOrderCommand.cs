using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ordering.Commands.CancelOrder;

public record CancelOrderCommand(Guid OrderId, string Reason) : ICommand;
