namespace Qaflaty.Application.Catalog.DTOs;

public record PromoCodeDto(
    Guid Id,
    Guid StoreId,
    string Code,
    string? Description,
    string DiscountType,
    decimal Value,
    decimal? MinimumOrderAmount,
    decimal? MaxDiscountAmount,
    DateTime? StartsAt,
    DateTime? ExpiresAt,
    int? UsageLimit,
    int? UsageLimitPerCustomer,
    int TimesUsed,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt);
