using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Identity.Aggregates.Merchant;
using Qaflaty.Domain.Identity.Aggregates.StoreCustomer;

namespace Qaflaty.Application.Identity.Services;

public interface ITokenService
{
    string GenerateAccessToken(Merchant merchant);
    string GenerateCustomerAccessToken(StoreCustomer customer);
    string GenerateRefreshToken();
    DateTime GetAccessTokenExpiration();
    DateTime GetRefreshTokenExpiration();
    MerchantId? ValidateAccessToken(string token);
    StoreCustomerId? ValidateCustomerAccessToken(string token);
}
