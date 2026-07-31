using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Enums;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Queries.GetDownsellAnalytics;

public class GetDownsellAnalyticsQueryHandler
    : IQueryHandler<GetDownsellAnalyticsQuery, DownsellAnalyticsSummaryDto>
{
    private readonly IDownsellEventRepository _eventRepository;

    public GetDownsellAnalyticsQueryHandler(IDownsellEventRepository eventRepository)
    {
        _eventRepository = eventRepository;
    }

    public async Task<Result<DownsellAnalyticsSummaryDto>> Handle(
        GetDownsellAnalyticsQuery request, CancellationToken ct)
    {
        var events = await _eventRepository.GetByStoreIdAsync(request.StoreId, request.From, request.To, ct);

        var totalImpressions = events.Count(e => e.EventType == DownsellEventType.Impression);
        var totalAccepts = events.Count(e => e.EventType == DownsellEventType.Accept);
        var totalDismissals = events.Count(e => e.EventType == DownsellEventType.Dismiss);
        var totalCouponRedemptions = events.Count(e => e.EventType == DownsellEventType.CouponRedeemed);
        var totalConversions = events.Count(e => e.EventType == DownsellEventType.Converted);

        var acceptanceRate = totalImpressions == 0
            ? 0m
            : Math.Round((decimal)totalAccepts / totalImpressions * 100, 2);

        var byTrigger = events
            .Where(e => e.TriggerType.HasValue)
            .GroupBy(e => e.TriggerType!.Value)
            .Select(g => new DownsellTriggerBreakdownDto(
                g.Key.ToString(),
                g.Count(e => e.EventType == DownsellEventType.Impression),
                g.Count(e => e.EventType == DownsellEventType.Accept),
                g.Count(e => e.EventType == DownsellEventType.Dismiss)))
            .ToList();

        var summary = new DownsellAnalyticsSummaryDto(
            totalImpressions, totalAccepts, totalDismissals, totalCouponRedemptions, totalConversions,
            acceptanceRate, byTrigger);

        return Result.Success(summary);
    }
}
