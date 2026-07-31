namespace Qaflaty.Application.Ads.DTOs;

public record TimelineEntryDto(
    DateTime Timestamp,
    string EventType,
    string Channel,
    Guid EventKey,
    List<TimelineDispatchDto> Dispatches);

public record TimelineDispatchDto(
    string Provider,
    string Status,
    int? ResponseStatus,
    string? ErrorMessage);

public record EventTimelineDto(Guid OrderId, List<TimelineEntryDto> Entries, bool Deduplicated);
