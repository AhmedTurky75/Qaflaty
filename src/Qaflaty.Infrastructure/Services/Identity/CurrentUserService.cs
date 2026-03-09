using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Services.Identity;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public MerchantId? MerchantId
    {
        get
        {
            var merchantIdClaim = _httpContextAccessor.HttpContext?.User.FindFirst("merchant_id");
            if (merchantIdClaim != null && Guid.TryParse(merchantIdClaim.Value, out var merchantGuid))
                return new MerchantId(merchantGuid);
            return null;
        }
    }

    public StoreCustomerId? CustomerId
    {
        get
        {
            var customerIdClaim = _httpContextAccessor.HttpContext?.User.FindFirst("customer_id");
            if (customerIdClaim != null && Guid.TryParse(customerIdClaim.Value, out var customerGuid))
                return new StoreCustomerId(customerGuid);
            return null;
        }
    }

    public StoreId? StoreId
    {
        get
        {
            var storeIdClaim = _httpContextAccessor.HttpContext?.User.FindFirst("store_id");
            if (storeIdClaim != null && Guid.TryParse(storeIdClaim.Value, out var storeGuid))
                return new StoreId(storeGuid);
            return null;
        }
    }

    public string? Role
    {
        get
        {
            var roleClaim = _httpContextAccessor.HttpContext?.User.FindFirst("role");
            return roleClaim?.Value;
        }
    }

    public string[]? Permissions
    {
        get
        {
            var permissionsClaim = _httpContextAccessor.HttpContext?.User.FindFirst("permissions");
            if (permissionsClaim == null || string.IsNullOrWhiteSpace(permissionsClaim.Value))
                return null;
            return permissionsClaim.Value.Split(',', StringSplitOptions.RemoveEmptyEntries);
        }
    }

    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated ?? false;

    public bool IsMerchant => MerchantId.HasValue;

    public bool IsCustomer => CustomerId.HasValue;
}
