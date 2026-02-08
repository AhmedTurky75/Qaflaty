using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ordering.Commands.ConfirmOrder;

public record ConfirmOrderCommand(Guid OrderId) : ICommand;
