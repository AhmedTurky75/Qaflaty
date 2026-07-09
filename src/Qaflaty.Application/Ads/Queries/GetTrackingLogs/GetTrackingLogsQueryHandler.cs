using Qaflaty.Application.Ads.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Ads.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Ads.Queries.GetTrackingLogs;

public class GetTrackingLogsQueryHandler : IQueryHandler<GetTrackingLogsQuery, PagedTrackingLogsDto>
{
    private readonly ITrackingEventRepository _trackingEventRepository;

    public GetTrackingLogsQueryHandler(ITrackingEventRepository trackingEventRepository)
    {
        _trackingEventRepository = trackingEventRepository;
    }

    public async Task<Result<PagedTrackingLogsDto>> Handle(GetTrackingLogsQuery request, CancellationToken cancellationToken)
    {
        var storeId = StoreId.From(request.StoreId);

        var (events, totalCount) = await _trackingEventRepository.SearchAsync(
            storeId, request.EventType, request.Provider, request.Status, request.From, request.To,
            request.PageNumber, request.PageSize, cancellationToken);

        var rows = new List<TrackingLogRowDto>();
        foreach (var trackingEvent in events)
        {
            var logs = trackingEvent.DispatchLogs.AsEnumerable();
            if (request.Provider.HasValue)
                logs = logs.Where(l => l.Provider == request.Provider.Value);
            if (request.Status.HasValue)
                logs = logs.Where(l => l.Status == request.Status.Value);

            foreach (var log in logs)
            {
                rows.Add(new TrackingLogRowDto(
                    trackingEvent.Id.Value,
                    log.Id,
                    trackingEvent.CreatedAt,
                    log.Provider.ToString(),
                    trackingEvent.EventType.ToString(),
                    trackingEvent.OrderId?.Value,
                    trackingEvent.Channel.ToString(),
                    log.Status.ToString(),
                    log.AttemptCount,
                    log.DurationMs,
                    log.ResponseStatus,
                    log.ResponseBody,
                    log.ErrorMessage,
                    trackingEvent.CorrelationId));
            }

            // Browser-channel rows never get dispatch logs (nothing to send server-side for them) —
            // still surface one informational row so the Logs page shows the pixel fired.
            if (trackingEvent.DispatchLogs.Count == 0 && !request.Provider.HasValue && !request.Status.HasValue)
            {
                rows.Add(new TrackingLogRowDto(
                    trackingEvent.Id.Value,
                    Guid.Empty,
                    trackingEvent.CreatedAt,
                    "-",
                    trackingEvent.EventType.ToString(),
                    trackingEvent.OrderId?.Value,
                    trackingEvent.Channel.ToString(),
                    "Fired",
                    0,
                    null,
                    null,
                    null,
                    null,
                    trackingEvent.CorrelationId));
            }
        }

        return Result.Success(new PagedTrackingLogsDto(rows, totalCount, request.PageNumber, request.PageSize));
    }
}
