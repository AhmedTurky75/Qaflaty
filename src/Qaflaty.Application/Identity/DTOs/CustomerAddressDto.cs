namespace Qaflaty.Application.Identity.DTOs;

public record CustomerAddressDto(
    string Label,
    string Street,
    string City,
    string State,
    string PostalCode,
    string Country,
    bool IsDefault
);
