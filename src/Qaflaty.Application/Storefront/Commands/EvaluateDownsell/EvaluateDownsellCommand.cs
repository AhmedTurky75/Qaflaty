using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Enums;

namespace Qaflaty.Application.Storefront.Commands.EvaluateDownsell;

public record DownsellCouponPreviewDto(string Code, string DiscountType, decimal Value, string? Description);

public record DownsellDecisionDto(
    IReadOnlyList<ProductPublicDto> DownsellProducts,
    DownsellCouponPreviewDto? Coupon);

/// <summary>
/// Asks the server "should a downsell offer be shown right now?" The client only reports that it
/// detected a signal (and, for duration-based triggers, how long) — the server decides whether
/// the rule is actually enabled, whether the session's frequency cap allows another impression,
/// and what (if anything) to show. A successful evaluation that returns an offer also records an
/// impression event, which is why this is a command (has a side effect) rather than a query.
/// </summary>
public record EvaluateDownsellCommand(
    StoreId StoreId,
    DownsellSurface Surface,
    DownsellTriggerType TriggerType,
    ProductId? ProductId,
    string SessionKey,
    int? ElapsedSeconds
) : ICommand<DownsellDecisionDto?>;
