namespace Qaflaty.Application.Identity.DTOs;

public record MerchantDto(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string FullName,
    string Username,
    string? Phone,
    bool IsVerified,
    DateTime CreatedAt,
    string? PhoneCountryCode = null
);
