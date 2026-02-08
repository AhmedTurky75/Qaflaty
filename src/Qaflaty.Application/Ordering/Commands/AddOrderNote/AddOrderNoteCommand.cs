using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ordering.Commands.AddOrderNote;

public record AddOrderNoteCommand(Guid OrderId, string Note) : ICommand;
