namespace Qaflaty.Application.Identity.DTOs;

public record CustomerAuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    StoreCustomerDto Customer
);
