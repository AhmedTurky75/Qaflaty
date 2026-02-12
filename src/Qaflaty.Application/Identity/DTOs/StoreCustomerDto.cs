namespace Qaflaty.Application.Identity.DTOs;

public record StoreCustomerDto(
    Guid Id,
    string Email,
    string FullName,
    string? Phone,
    bool IsVerified,
    DateTime CreatedAt,
    List<CustomerAddressDto> Addresses
);
