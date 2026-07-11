using Qaflaty.Application.Ads.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Ads.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Ads.Queries.GetMonitoring;

public class GetMonitoringQueryHandler : IQueryHandler<GetMonitoringQuery, MonitoringDto>
{
    private readonly ITrackingEventRepository _trackingEventRepository;

    public GetMonitoringQueryHandler(ITrackingEventRepository trackingEventRepository)
    {
        _trackingEventRepository = trackingEventRepository;
    }

    public async Task<Result<MonitoringDto>> Handle(GetMonitoringQuery request, CancellationToken cancellationToken)
    {
        var storeId = StoreId.From(request.StoreId);
        var sinceUtc = DateTime.UtcNow.AddDays(-7);

        var stats = await _trackingEventRepository.GetProviderMonitoringStatsAsync(storeId, sinceUtc, cancellationToken);

        var providers = stats.Select(s =>
        {
            var total = s.SuccessCount + s.FailureCount;
            var successRate = total == 0 ? 100d : Math.Round(s.SuccessCount * 100d / total, 1);
            var failureRate = total == 0 ? 0d : Math.Round(s.FailureCount * 100d / total, 1);
            return new ProviderMonitoringDto(
                s.Provider.ToString(),
                successRate, // uptime approximated by success rate over the rolling window
                Math.Round(s.AvgDurationMs, 0),
                successRate,
                failureRate,
                s.FailureCount);
        }).ToList();

        return Result.Success(new MonitoringDto(providers));
    }
}
