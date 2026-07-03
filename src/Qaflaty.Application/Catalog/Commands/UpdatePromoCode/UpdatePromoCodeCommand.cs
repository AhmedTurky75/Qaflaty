using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.UpdatePromoCode;

public record UpdatePromoCodeCommand(
    PromoCodeId Id,
    StoreId StoreId,
    string? Description,
    string DiscountType,
    decimal Value,
    decimal? MinimumOrderAmount,
    decimal? MaxDiscountAmount,
    DateTime? StartsAt,
    DateTime? ExpiresAt,
    int? UsageLimit,
    int? UsageLimitPerCustomer,
    // See CreatePromoCodeCommand: only when true is the per-customer limit stored as null
    // (unlimited); otherwise an unspecified value defaults to 1.
    bool UnlimitedPerCustomer = false
) : ICommand<PromoCodeDto>;
