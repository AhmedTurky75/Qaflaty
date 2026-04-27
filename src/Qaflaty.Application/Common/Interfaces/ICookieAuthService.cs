using Microsoft.AspNetCore.Http;

namespace Qaflaty.Application.Common.Interfaces;

public interface ICookieAuthService
{
    void SetAuthCookies(HttpContext context, string accessToken, string refreshToken, bool isSecure = false);
    void ClearAuthCookies(HttpContext context);

    void SetMerchantAuthCookies(HttpContext context, string accessToken, string refreshToken);
    void ClearMerchantAuthCookies(HttpContext context);

    void SetCustomerAuthCookies(HttpContext context, string accessToken, string refreshToken);
    void ClearCustomerAuthCookies(HttpContext context);
}
