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
using Qaflaty.Domain.Identity.Enums;
using Qaflaty.Domain.Identity.Services;

namespace Qaflaty.Infrastructure.Services.Identity;

public class JwtTokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    // Role-specific merchant token (15 min by default)
    public string GenerateMerchantAccessToken(Merchant merchant)
    {
        var key = GetSigningKey();
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
            expires: GetMerchantAccessTokenExpiration(),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // Merchant token with store context (role + permissions)
    public string GenerateMerchantAccessToken(Merchant merchant, StoreId? storeId, MerchantRole? role)
    {
        if (storeId == null || role == null)
            return GenerateMerchantAccessToken(merchant);

        var key = GetSigningKey();
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var permissions = RolePermissions.GetPermissions(role.Value);
        var permissionNames = Enum.GetValues<MerchantPermission>()
            .Where(p => p != MerchantPermission.None && permissions.HasFlag(p))
            .Select(p => p.ToString())
            .ToArray();

        var claimsList = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, merchant.Id.Value.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, merchant.Email.Value),
            new Claim("merchant_id", merchant.Id.Value.ToString()),
            new Claim(ClaimTypes.Role, "merchant"),
            new Claim("store_id", storeId.Value.Value.ToString()),
            new Claim("role", role.Value.ToString()),
            new Claim("permissions", string.Join(",", permissionNames)),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"],
            audience: _configuration["JwtSettings:Audience"],
            claims: claimsList,
            expires: GetMerchantAccessTokenExpiration(),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // Role-specific customer token (60 min by default)
    public string GenerateCustomerAccessToken(StoreCustomer customer)
    {
        var key = GetSigningKey();
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
            expires: GetCustomerAccessTokenExpiration(),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public DateTime GetMerchantAccessTokenExpiration()
    {
        var minutes = int.Parse(_configuration["JwtSettings:MerchantAccessTokenExpirationMinutes"] ?? "15");
        return DateTime.UtcNow.AddMinutes(minutes);
    }

    public DateTime GetCustomerAccessTokenExpiration()
    {
        var minutes = int.Parse(_configuration["JwtSettings:CustomerAccessTokenExpirationMinutes"] ?? "60");
        return DateTime.UtcNow.AddMinutes(minutes);
    }

    // Legacy method — delegates to GenerateMerchantAccessToken
    public string GenerateAccessToken(Merchant merchant)
        => GenerateMerchantAccessToken(merchant);

    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    // Legacy method — returns merchant expiration for backward compat
    public DateTime GetAccessTokenExpiration()
        => GetMerchantAccessTokenExpiration();

    public DateTime GetRefreshTokenExpiration()
    {
        var days = int.Parse(_configuration["JwtSettings:RefreshTokenExpirationDays"] ?? "7");
        return DateTime.UtcNow.AddDays(days);
    }

    public MerchantId? ValidateAccessToken(string token)
    {
        try
        {
            var key = GetSigningKey();
            var tokenHandler = new JwtSecurityTokenHandler();
            var validationParameters = GetValidationParameters(key);

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
            var key = GetSigningKey();
            var tokenHandler = new JwtSecurityTokenHandler();
            var validationParameters = GetValidationParameters(key);

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

    private SymmetricSecurityKey GetSigningKey()
        => new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _configuration["JwtSettings:SecretKey"] ?? throw new InvalidOperationException("JWT Secret not configured")));

    private TokenValidationParameters GetValidationParameters(SymmetricSecurityKey key)
        => new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = _configuration["JwtSettings:Issuer"],
            ValidAudience = _configuration["JwtSettings:Audience"],
            IssuerSigningKey = key
        };
}
