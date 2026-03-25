using Microsoft.AspNetCore.Http;
using Qaflaty.Application.Common.Interfaces;

namespace Qaflaty.Infrastructure.Services.Identity;

public class CookieAuthService : ICookieAuthService
{
    public void SetAuthCookies(HttpContext context, string accessToken, string refreshToken, bool isSecure = false)
    {
        var accessTokenOptions = new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.None,
            Secure = true,
            Path = "/"
        };

        var refreshTokenOptions = new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.None,
            Secure = true,
            Path = "/"
        };

        context.Response.Cookies.Append("access_token", accessToken, accessTokenOptions);
        context.Response.Cookies.Append("refresh_token", refreshToken, refreshTokenOptions);
    }

    public void ClearAuthCookies(HttpContext context)
    {
        var clearOptions = new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.None,
            Secure = true,
            Path = "/"
        };

        context.Response.Cookies.Delete("access_token", clearOptions);
        context.Response.Cookies.Delete("refresh_token", clearOptions);
    }
}
