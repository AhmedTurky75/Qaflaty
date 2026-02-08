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

    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated ?? false;
}
