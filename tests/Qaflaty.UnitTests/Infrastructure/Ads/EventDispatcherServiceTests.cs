using Microsoft.Extensions.Logging.Abstractions;
using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Domain.Ads.Aggregates.ProviderIntegration;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Infrastructure.Services.Ads;
using Xunit;

namespace Qaflaty.UnitTests.Infrastructure.Ads;

public class EventDispatcherServiceTests
{
    private static TrackingEventPayload Payload(StoreId storeId, Guid eventKey) => new(
        storeId, eventKey, TrackingEventType.Purchase, TrackingChannel.Server, DateTime.UtcNow,
        OrderId: null, CustomerRef: null, Value: 10m, Currency: "SAR", Contents: null,
        PageUrl: null, ClientIpAddress: null, ClientUserAgent: null, CustomerEmail: null, CustomerPhone: null);

    private static ProviderIntegration EnabledIntegration(StoreId storeId, AdProvider provider)
    {
        var integration = ProviderIntegration.Connect(storeId, provider, "{}", true, true).Value;
        integration.MarkVerified();
        return integration;
    }

    [Fact]
    public async Task DispatchAsync_FansOutToEveryEnabledProvider()
    {
        var storeId = StoreId.New();
        var metaIntegration = EnabledIntegration(storeId, AdProvider.Meta);
        var tiktokIntegration = EnabledIntegration(storeId, AdProvider.TikTok);
        var integrationRepo = new InMemoryProviderIntegrationRepository(metaIntegration, tiktokIntegration);
        var trackingRepo = new InMemoryTrackingEventRepository();
        var metaProvider = new StubTrackingProvider(AdProvider.Meta);
        var tiktokProvider = new StubTrackingProvider(AdProvider.TikTok);
        var resolver = new FakeTrackingProviderResolver(metaProvider, tiktokProvider);
        var queue = new FakeEventQueue();
        var unitOfWork = new NoOpUnitOfWork();

        var dispatcher = new EventDispatcherService(
            integrationRepo, trackingRepo, resolver, new FakeProviderConfiguration(),
            new TrackingLoggerService(), queue, unitOfWork, NullLogger<EventDispatcherService>.Instance);

        await dispatcher.DispatchAsync(Payload(storeId, Guid.NewGuid()), CancellationToken.None);

        Assert.Equal(1, metaProvider.SendCallCount);
        Assert.Equal(1, tiktokProvider.SendCallCount);
        Assert.Single(trackingRepo.Store);
        Assert.Equal(2, trackingRepo.Store[0].DispatchLogs.Count);
        Assert.All(trackingRepo.Store[0].DispatchLogs, log => Assert.Equal(DispatchStatus.Succeeded, log.Status));
        Assert.Equal(100, metaIntegration.HealthScore); // stayed healthy after a successful send
    }

    [Fact]
    public async Task DispatchAsync_SameEventKeyTwice_OnlyDispatchesOnce()
    {
        var storeId = StoreId.New();
        var integrationRepo = new InMemoryProviderIntegrationRepository(EnabledIntegration(storeId, AdProvider.Meta));
        var trackingRepo = new InMemoryTrackingEventRepository();
        var metaProvider = new StubTrackingProvider(AdProvider.Meta);
        var dispatcher = new EventDispatcherService(
            integrationRepo, trackingRepo, new FakeTrackingProviderResolver(metaProvider), new FakeProviderConfiguration(),
            new TrackingLoggerService(), new FakeEventQueue(), new NoOpUnitOfWork(), NullLogger<EventDispatcherService>.Instance);

        var eventKey = Guid.NewGuid();
        await dispatcher.DispatchAsync(Payload(storeId, eventKey), CancellationToken.None);
        await dispatcher.DispatchAsync(Payload(storeId, eventKey), CancellationToken.None); // duplicate delivery

        Assert.Equal(1, trackingRepo.AddCallCount);
        Assert.Equal(1, metaProvider.SendCallCount);
    }

    [Fact]
    public async Task DispatchAsync_ProviderFailure_QueuesFastRetryAndDamagesHealth()
    {
        var storeId = StoreId.New();
        var integration = EnabledIntegration(storeId, AdProvider.Meta);
        var integrationRepo = new InMemoryProviderIntegrationRepository(integration);
        var trackingRepo = new InMemoryTrackingEventRepository();
        var failingProvider = new StubTrackingProvider(AdProvider.Meta, succeeds: false);
        var queue = new FakeEventQueue();

        var dispatcher = new EventDispatcherService(
            integrationRepo, trackingRepo, new FakeTrackingProviderResolver(failingProvider), new FakeProviderConfiguration(),
            new TrackingLoggerService(), queue, new NoOpUnitOfWork(), NullLogger<EventDispatcherService>.Instance);

        await dispatcher.DispatchAsync(Payload(storeId, Guid.NewGuid()), CancellationToken.None);

        Assert.Equal(90, integration.HealthScore);
        Assert.Equal(IntegrationStatus.Error, integration.Status);
        Assert.Single(queue.Enqueued);
        Assert.Equal(DispatchStatus.Failed, trackingRepo.Store[0].DispatchLogs[0].Status);
    }

    [Fact]
    public async Task DispatchAsync_NoEnabledProviders_StillRecordsTheEventForTheTimeline()
    {
        var storeId = StoreId.New();
        var trackingRepo = new InMemoryTrackingEventRepository();
        var dispatcher = new EventDispatcherService(
            new InMemoryProviderIntegrationRepository(), trackingRepo, new FakeTrackingProviderResolver(),
            new FakeProviderConfiguration(), new TrackingLoggerService(), new FakeEventQueue(),
            new NoOpUnitOfWork(), NullLogger<EventDispatcherService>.Instance);

        await dispatcher.DispatchAsync(Payload(storeId, Guid.NewGuid()), CancellationToken.None);

        Assert.Single(trackingRepo.Store);
        Assert.Empty(trackingRepo.Store[0].DispatchLogs);
    }
}
