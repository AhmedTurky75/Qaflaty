namespace Qaflaty.Application.Ads.DTOs;

public record AdsDashboardStatsDto(
    int EventsToday,
    int PurchaseEventsToday,
    int FailedEventsToday,
    int PendingRetries,
    double AverageDeliveryTimeMs);

public record AdsProviderCardDto(
    Guid Id,
    string Provider,
    string Status,
    bool BrowserTrackingEnabled,
    bool ServerTrackingEnabled,
    int HealthScore,
    DateTime? LastEventAt,
    int EventsToday,
    string? LastErrorMessage);

public record AdsDashboardDto(
    AdsDashboardStatsDto Stats,
    List<AdsProviderCardDto> Providers);
