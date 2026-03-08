using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Identity.Aggregates.Merchant;
using Qaflaty.Domain.Identity.Aggregates.StoreCustomer;

namespace Qaflaty.Application.Identity.Services;

public interface ITokenService
{
    // Role-specific token generation (preferred)
    string GenerateMerchantAccessToken(Merchant merchant);
    string GenerateCustomerAccessToken(StoreCustomer customer);
    DateTime GetMerchantAccessTokenExpiration();
    DateTime GetCustomerAccessTokenExpiration();

    // Legacy methods kept for backward compatibility
    string GenerateAccessToken(Merchant merchant);
    string GenerateRefreshToken();
    DateTime GetAccessTokenExpiration();
    DateTime GetRefreshTokenExpiration();
    MerchantId? ValidateAccessToken(string token);
    StoreCustomerId? ValidateCustomerAccessToken(string token);
}
