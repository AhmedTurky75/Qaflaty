using Qaflaty.Application.Ads.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Ads.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Ads.Queries.GetDashboard;

public class GetDashboardQueryHandler : IQueryHandler<GetDashboardQuery, AdsDashboardDto>
{
    private readonly IProviderIntegrationRepository _integrationRepository;
    private readonly ITrackingEventRepository _trackingEventRepository;

    public GetDashboardQueryHandler(
        IProviderIntegrationRepository integrationRepository,
        ITrackingEventRepository trackingEventRepository)
    {
        _integrationRepository = integrationRepository;
        _trackingEventRepository = trackingEventRepository;
    }

    public async Task<Result<AdsDashboardDto>> Handle(GetDashboardQuery request, CancellationToken cancellationToken)
    {
        var storeId = StoreId.From(request.StoreId);
        var sinceUtc = DateTime.UtcNow.Date;

        var integrations = await _integrationRepository.GetByStoreIdAsync(storeId, cancellationToken);
        var eventsToday = await _trackingEventRepository.CountEventsAsync(storeId, null, sinceUtc, cancellationToken);
        var purchasesToday = await _trackingEventRepository.CountEventsAsync(storeId, TrackingEventType.Purchase, sinceUtc, cancellationToken);
        var failedToday = await _trackingEventRepository.CountDispatchesByStatusAsync(storeId, DispatchStatus.Failed, sinceUtc, cancellationToken);
        var deadLetteredToday = await _trackingEventRepository.CountDispatchesByStatusAsync(storeId, DispatchStatus.DeadLettered, sinceUtc, cancellationToken);
        var pendingRetries = await _trackingEventRepository.CountDispatchesByStatusAsync(storeId, DispatchStatus.Pending, sinceUtc, cancellationToken);
        var avgDeliveryMs = await _trackingEventRepository.GetAverageDispatchDurationMsAsync(storeId, sinceUtc, cancellationToken);
        var eventCountsByProvider = (await _trackingEventRepository.GetEventCountsByProviderAsync(storeId, sinceUtc, cancellationToken))
            .ToDictionary(x => x.Provider, x => x.EventCount);

        var providerCards = integrations.Select(i => new AdsProviderCardDto(
            i.Id.Value,
            i.Provider.ToString(),
            i.Status.ToString(),
            i.BrowserTrackingEnabled,
            i.ServerTrackingEnabled,
            i.HealthScore,
            i.LastEventAt,
            eventCountsByProvider.GetValueOrDefault(i.Provider, 0),
            i.LastErrorMessage)).ToList();

        var stats = new AdsDashboardStatsDto(
            eventsToday,
            purchasesToday,
            failedToday + deadLetteredToday,
            pendingRetries,
            Math.Round(avgDeliveryMs, 0));

        return Result.Success(new AdsDashboardDto(stats, providerCards));
    }
}
