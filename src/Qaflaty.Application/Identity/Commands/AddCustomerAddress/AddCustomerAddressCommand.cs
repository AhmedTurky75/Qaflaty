using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Identity.Commands.AddCustomerAddress;

public record AddCustomerAddressCommand(
    StoreCustomerId CustomerId,
    string Label,
    string Street,
    string City,
    string State,
    string PostalCode,
    string Country,
    bool IsDefault
) : ICommand;
