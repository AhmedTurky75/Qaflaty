using Microsoft.AspNetCore.Http;

namespace Qaflaty.Application.Common.Interfaces;

public interface ICookieAuthService
{
    void SetAuthCookies(HttpContext context, string accessToken, string refreshToken, bool isSecure = false);
    void ClearAuthCookies(HttpContext context);
}
