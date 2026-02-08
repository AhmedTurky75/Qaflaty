namespace Qaflaty.Application.Identity.DTOs;

public record MerchantDto(
    Guid Id,
    string Email,
    string FullName,
    string? Phone,
    bool IsVerified,
    DateTime CreatedAt
);
