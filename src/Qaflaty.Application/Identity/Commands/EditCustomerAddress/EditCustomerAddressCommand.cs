using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Identity.Commands.EditCustomerAddress;

public record EditCustomerAddressCommand(
    StoreCustomerId CustomerId,
    string OriginalLabel,
    string Label,
    string Street,
    string City,
    string State,
    string PostalCode,
    string Country,
    bool IsDefault,
    decimal Latitude,
    decimal Longitude
) : ICommand;
