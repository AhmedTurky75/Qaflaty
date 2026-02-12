using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Identity.Commands.RemoveCustomerAddress;

public record RemoveCustomerAddressCommand(
    StoreCustomerId CustomerId,
    string Label
) : ICommand;
