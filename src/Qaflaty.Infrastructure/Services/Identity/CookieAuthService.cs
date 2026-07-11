using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Qaflaty.Application.Common.Interfaces;

namespace Qaflaty.Infrastructure.Services.Identity;

public class CookieAuthService : ICookieAuthService
{
    private readonly CookieOptions DefaultOptions;

    public CookieAuthService(IHostEnvironment environment)
    {
        // The Angular dev servers proxy /api to this backend (see proxy.conf.json),
        // so in local development the browser only ever talks to the frontend's own
        // origin — cookies can use SameSite=Lax instead of None, and don't need
        // Secure since the dev servers run over plain HTTP.
        DefaultOptions = new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Secure = !environment.IsDevelopment(),
            Path = "/"
        };
    }

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
