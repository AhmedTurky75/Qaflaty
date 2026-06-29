using Qaflaty.Domain.Catalog.Aggregates.PromoCode;

namespace Qaflaty.Application.Catalog.DTOs;

public static class PromoCodeMapper
{
    public static PromoCodeDto ToDto(this PromoCode p) => new(
        p.Id.Value,
        p.StoreId.Value,
        p.Code,
        p.Description,
        p.DiscountType.ToString(),
        p.Value,
        p.MinimumOrderAmount,
        p.MaxDiscountAmount,
        p.StartsAt,
        p.ExpiresAt,
        p.UsageLimit,
        p.UsageLimitPerCustomer,
        p.TimesUsed,
        p.IsActive,
        p.CreatedAt,
        p.UpdatedAt);
}
