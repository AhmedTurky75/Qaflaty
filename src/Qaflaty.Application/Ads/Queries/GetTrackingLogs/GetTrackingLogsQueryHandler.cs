using Qaflaty.Application.Ads.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Ads.Enums;
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

            // A row with zero dispatch logs means different things per channel:
            // Browser rows never get dispatch logs at all (the pixel already fired
            // client-side, there's nothing server-side to send) — that's expected, "Fired".
            // Server rows only end up with zero logs when no provider was enabled for
            // server tracking at dispatch time — that's a configuration gap, not a success.
            if (trackingEvent.DispatchLogs.Count == 0 && !request.Provider.HasValue && !request.Status.HasValue)
            {
                var status = trackingEvent.Channel == TrackingChannel.Browser ? "Fired" : "No Providers Enabled";
                rows.Add(new TrackingLogRowDto(
                    trackingEvent.Id.Value,
                    Guid.Empty,
                    trackingEvent.CreatedAt,
                    "-",
                    trackingEvent.EventType.ToString(),
                    trackingEvent.OrderId?.Value,
                    trackingEvent.Channel.ToString(),
                    status,
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
