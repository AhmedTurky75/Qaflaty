using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ordering.Commands.ProcessOrder;

public record ProcessOrderCommand(Guid OrderId) : ICommand;
