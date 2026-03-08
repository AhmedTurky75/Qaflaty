namespace Qaflaty.Application.Identity.DTOs;

public record StoreCustomerDto(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string FullName,
    string Username,
    string? Phone,
    string? SecondaryPhone,
    bool IsVerified,
    DateTime CreatedAt,
    List<CustomerAddressDto> Addresses
);
