using Qaflaty.Application.Ads.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ads.Queries.GetEventTimeline;

public record GetEventTimelineQuery(Guid StoreId, Guid OrderId) : IQuery<EventTimelineDto>;
