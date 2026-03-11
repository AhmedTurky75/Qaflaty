using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Identity.Commands.UpdateCustomerProfile;

public record UpdateCustomerProfileCommand(
    StoreCustomerId CustomerId,
    string FirstName,
    string LastName,
    string? Phone,
    string? SecondaryPhone = null
) : ICommand;
