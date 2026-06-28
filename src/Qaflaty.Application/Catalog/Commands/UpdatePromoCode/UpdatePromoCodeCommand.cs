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
    int? UsageLimitPerCustomer
) : ICommand<PromoCodeDto>;
