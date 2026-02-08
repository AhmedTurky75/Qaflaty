using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Identity.Aggregates.Merchant;

namespace Qaflaty.Application.Identity.Services;

public interface ITokenService
{
    string GenerateAccessToken(Merchant merchant);
    string GenerateRefreshToken();
    DateTime GetAccessTokenExpiration();
    DateTime GetRefreshTokenExpiration();
    MerchantId? ValidateAccessToken(string token);
}
