using Microsoft.AspNetCore.Http;
using Qaflaty.Application.Common.Interfaces;

namespace Qaflaty.Infrastructure.Services.Identity;

public class CookieAuthService : ICookieAuthService
{
    private static readonly CookieOptions DefaultOptions = new()
    {
        HttpOnly = true,
        SameSite = SameSiteMode.None,
        Secure = true,
        Path = "/"
    };

    // Legacy methods kept for backward compatibility — delegate to merchant cookies
    public void SetAuthCookies(HttpContext context, string accessToken, string refreshToken, bool isSecure = false)
        => SetMerchantAuthCookies(context, accessToken, refreshToken);

    public void ClearAuthCookies(HttpContext context)
        => ClearMerchantAuthCookies(context);

    public void SetMerchantAuthCookies(HttpContext context, string accessToken, string refreshToken)
    {
        context.Response.Cookies.Append("merchant_access_token", accessToken, DefaultOptions);
        context.Response.Cookies.Append("merchant_refresh_token", refreshToken, DefaultOptions);
    }

    public void ClearMerchantAuthCookies(HttpContext context)
    {
        context.Response.Cookies.Delete("merchant_access_token", DefaultOptions);
        context.Response.Cookies.Delete("merchant_refresh_token", DefaultOptions);
        // Also clear legacy cookie names so old sessions are cleaned up
        context.Response.Cookies.Delete("access_token", DefaultOptions);
        context.Response.Cookies.Delete("refresh_token", DefaultOptions);
    }

    public void SetCustomerAuthCookies(HttpContext context, string accessToken, string refreshToken)
    {
        context.Response.Cookies.Append("customer_access_token", accessToken, DefaultOptions);
        context.Response.Cookies.Append("customer_refresh_token", refreshToken, DefaultOptions);
    }

    public void ClearCustomerAuthCookies(HttpContext context)
    {
        context.Response.Cookies.Delete("customer_access_token", DefaultOptions);
        context.Response.Cookies.Delete("customer_refresh_token", DefaultOptions);
        // Also clear legacy cookie names so old sessions are cleaned up
        context.Response.Cookies.Delete("access_token", DefaultOptions);
        context.Response.Cookies.Delete("refresh_token", DefaultOptions);
    }
}
