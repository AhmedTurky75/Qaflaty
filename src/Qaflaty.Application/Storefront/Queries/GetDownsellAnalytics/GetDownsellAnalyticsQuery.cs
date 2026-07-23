using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Queries.GetDownsellAnalytics;

public record DownsellTriggerBreakdownDto(string TriggerType, int Impressions, int Accepts, int Dismissals);

public record DownsellAnalyticsSummaryDto(
    int TotalImpressions,
    int TotalAccepts,
    int TotalDismissals,
    int TotalCouponRedemptions,
    int TotalConversions,
    decimal AcceptanceRate,
    IReadOnlyList<DownsellTriggerBreakdownDto> ByTrigger);

public record GetDownsellAnalyticsQuery(
    StoreId StoreId, DateTime? From = null, DateTime? To = null
) : IQuery<DownsellAnalyticsSummaryDto>;
