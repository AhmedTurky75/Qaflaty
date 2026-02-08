namespace Qaflaty.Application.Identity.DTOs;

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    MerchantDto Merchant
);
