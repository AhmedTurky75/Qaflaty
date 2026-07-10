using Qaflaty.Application.Ads.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Ads.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Ads.Queries.GetEventTimeline;

public class GetEventTimelineQueryHandler : IQueryHandler<GetEventTimelineQuery, EventTimelineDto>
{
    private readonly ITrackingEventRepository _trackingEventRepository;

    public GetEventTimelineQueryHandler(ITrackingEventRepository trackingEventRepository)
    {
        _trackingEventRepository = trackingEventRepository;
    }

    public async Task<Result<EventTimelineDto>> Handle(GetEventTimelineQuery request, CancellationToken cancellationToken)
    {
        var orderId = new OrderId(request.OrderId);
        var events = await _trackingEventRepository.GetByOrderIdAsync(orderId, cancellationToken);

        var ordered = events
            .Where(e => e.StoreId.Value == request.StoreId)
            .OrderBy(e => e.CreatedAt)
            .ToList();

        var entries = ordered.Select(e => new TimelineEntryDto(
            e.CreatedAt,
            e.EventType.ToString(),
            e.Channel.ToString(),
            e.EventKey,
            e.DispatchLogs.Select(l => new TimelineDispatchDto(
                l.Provider.ToString(), l.Status.ToString(), l.ResponseStatus, l.ErrorMessage)).ToList()
        )).ToList();

        // "Deduplicated" once both a Browser and a Server row exist for the same EventKey and at
        // least one provider dispatch on the server side succeeded — mirrors the provider's own
        // event_id-based deduplication for the same logical occurrence (e.g. Purchase).
        var deduplicated = ordered
            .GroupBy(e => e.EventKey)
            .Any(g => g.Select(e => e.Channel).Distinct().Count() > 1
                      && g.Any(e => e.DispatchLogs.Any(l => l.Status == DispatchStatus.Succeeded)));

        return Result.Success(new EventTimelineDto(request.OrderId, entries, deduplicated));
    }
}
