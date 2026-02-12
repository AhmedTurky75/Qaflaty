using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Qaflaty.Application.Identity.Services;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Identity.Aggregates.Merchant;
using Qaflaty.Domain.Identity.Aggregates.StoreCustomer;

namespace Qaflaty.Infrastructure.Services.Identity;

public class JwtTokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateAccessToken(Merchant merchant)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration["JwtSettings:SecretKey"] ?? throw new InvalidOperationException("JWT Secret not configured")));

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, merchant.Id.Value.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, merchant.Email.Value),
            new Claim("merchant_id", merchant.Id.Value.ToString()),
            new Claim(ClaimTypes.Role, "merchant"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"],
            audience: _configuration["JwtSettings:Audience"],
            claims: claims,
            expires: GetAccessTokenExpiration(),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateCustomerAccessToken(StoreCustomer customer)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration["JwtSettings:SecretKey"] ?? throw new InvalidOperationException("JWT Secret not configured")));

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, customer.Id.Value.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, customer.Email.Value),
            new Claim("customer_id", customer.Id.Value.ToString()),
            new Claim(ClaimTypes.Role, "customer"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"],
            audience: _configuration["JwtSettings:Audience"],
            claims: claims,
            expires: GetAccessTokenExpiration(),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    public DateTime GetAccessTokenExpiration()
    {
        var minutes = int.Parse(_configuration["JwtSettings:AccessTokenExpirationMinutes"] ?? "60");
        return DateTime.UtcNow.AddMinutes(minutes);
    }

    public DateTime GetRefreshTokenExpiration()
    {
        var days = int.Parse(_configuration["JwtSettings:RefreshTokenExpirationDays"] ?? "7");
        return DateTime.UtcNow.AddDays(days);
    }

    public MerchantId? ValidateAccessToken(string token)
    {
        try
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _configuration["JwtSettings:SecretKey"] ?? throw new InvalidOperationException("JWT Secret not configured")));

            var tokenHandler = new JwtSecurityTokenHandler();
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _configuration["JwtSettings:Issuer"],
                ValidAudience = _configuration["JwtSettings:Audience"],
                IssuerSigningKey = key
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out _);
            var merchantIdClaim = principal.FindFirst("merchant_id");

            if (merchantIdClaim != null && Guid.TryParse(merchantIdClaim.Value, out var merchantGuid))
                return new MerchantId(merchantGuid);

            return null;
        }
        catch
        {
            return null;
        }
    }

    public StoreCustomerId? ValidateCustomerAccessToken(string token)
    {
        try
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _configuration["JwtSettings:SecretKey"] ?? throw new InvalidOperationException("JWT Secret not configured")));

            var tokenHandler = new JwtSecurityTokenHandler();
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = _configuration["JwtSettings:Issuer"],
                ValidAudience = _configuration["JwtSettings:Audience"],
                IssuerSigningKey = key
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out _);
            var customerIdClaim = principal.FindFirst("customer_id");

            if (customerIdClaim != null && Guid.TryParse(customerIdClaim.Value, out var customerGuid))
                return new StoreCustomerId(customerGuid);

            return null;
        }
        catch
        {
            return null;
        }
    }
}
