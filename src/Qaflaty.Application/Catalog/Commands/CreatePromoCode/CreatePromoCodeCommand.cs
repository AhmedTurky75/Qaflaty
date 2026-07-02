using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.CreatePromoCode;

public record CreatePromoCodeCommand(
    StoreId StoreId,
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
    // Explicit opt-in for an uncapped per-customer limit. When false (the default), an
    // unspecified UsageLimitPerCustomer is treated as 1 so codes are never accidentally
    // reusable without limit by a single customer. Only when true is the limit stored as null.
    bool UnlimitedPerCustomer = false
) : ICommand<PromoCodeDto>;
