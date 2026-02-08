using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ordering.Commands.UpdateCustomerNotes;

public record UpdateCustomerNotesCommand(Guid CustomerId, string Note) : ICommand;
