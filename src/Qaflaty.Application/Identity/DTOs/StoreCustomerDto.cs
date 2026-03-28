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
    string? PhoneCountryCode = null,
    string? SecondaryPhoneCountryCode = null
);
