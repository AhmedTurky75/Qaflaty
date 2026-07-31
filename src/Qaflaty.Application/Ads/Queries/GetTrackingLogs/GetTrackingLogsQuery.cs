using Qaflaty.Application.Ads.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Ads.Enums;

namespace Qaflaty.Application.Ads.Queries.GetTrackingLogs;

public record GetTrackingLogsQuery(
    Guid StoreId,
    TrackingEventType? EventType,
    AdProvider? Provider,
    DispatchStatus? Status,
    DateTime? From,
    DateTime? To,
    int PageNumber = 1,
    int PageSize = 25
) : IQuery<PagedTrackingLogsDto>;
