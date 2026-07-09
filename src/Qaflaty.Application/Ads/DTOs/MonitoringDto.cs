namespace Qaflaty.Application.Ads.DTOs;

public record ProviderMonitoringDto(
    string Provider,
    double UptimePercent,
    double AvgLatencyMs,
    double SuccessRatePercent,
    double FailureRatePercent,
    int RetryCount);

public record MonitoringDto(List<ProviderMonitoringDto> Providers);
