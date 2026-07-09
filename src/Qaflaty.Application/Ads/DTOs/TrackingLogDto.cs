namespace Qaflaty.Application.Ads.DTOs;

public record TrackingLogRowDto(
    Guid TrackingEventId,
    Guid DispatchLogId,
    DateTime Date,
    string Provider,
    string EventType,
    Guid? OrderId,
    string Channel,
    string Status,
    int AttemptCount,
    int? DurationMs,
    int? ResponseStatus,
    string? ResponseBody,
    string? ErrorMessage,
    Guid CorrelationId);

public record PagedTrackingLogsDto(List<TrackingLogRowDto> Items, int TotalCount, int PageNumber, int PageSize);
