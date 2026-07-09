using Qaflaty.Domain.Ads.Aggregates.TrackingEvent;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Common.Identifiers;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Ads;

public class TrackingEventTests
{
    [Fact]
    public void Create_WithEmptyEventKey_Fails()
    {
        var result = TrackingEvent.Create(
            StoreId.New(), Guid.Empty, TrackingEventType.Purchase, TrackingChannel.Server, "{}", Guid.NewGuid());

        Assert.True(result.IsFailure);
        Assert.Equal("TrackingEvent.EventKeyRequired", result.Error.Code);
    }

    [Fact]
    public void Create_WithValidData_Succeeds()
    {
        var storeId = StoreId.New();
        var eventKey = Guid.NewGuid();

        var result = TrackingEvent.Create(storeId, eventKey, TrackingEventType.Purchase, TrackingChannel.Server, "{}", Guid.NewGuid());

        Assert.True(result.IsSuccess);
        Assert.Equal(storeId, result.Value.StoreId);
        Assert.Equal(eventKey, result.Value.EventKey);
        Assert.Empty(result.Value.DispatchLogs);
    }

    [Fact]
    public void QueueDispatch_AddsAPendingLogPerProvider()
    {
        var trackingEvent = TrackingEvent.Create(
            StoreId.New(), Guid.NewGuid(), TrackingEventType.Purchase, TrackingChannel.Server, "{}", Guid.NewGuid()).Value;

        trackingEvent.QueueDispatch(AdProvider.Meta);
        trackingEvent.QueueDispatch(AdProvider.TikTok);

        Assert.Equal(2, trackingEvent.DispatchLogs.Count);
        Assert.All(trackingEvent.DispatchLogs, log => Assert.Equal(DispatchStatus.Pending, log.Status));
    }

    [Fact]
    public void ReplayDispatch_UnknownLogId_ReturnsNotFound()
    {
        var trackingEvent = TrackingEvent.Create(
            StoreId.New(), Guid.NewGuid(), TrackingEventType.Purchase, TrackingChannel.Server, "{}", Guid.NewGuid()).Value;

        var result = trackingEvent.ReplayDispatch(Guid.NewGuid());

        Assert.True(result.IsFailure);
        Assert.Equal("Ads.DispatchLogNotFound", result.Error.Code);
    }

    [Fact]
    public void ReplayDispatch_ExistingDeadLetteredLog_ResetsToPending()
    {
        var trackingEvent = TrackingEvent.Create(
            StoreId.New(), Guid.NewGuid(), TrackingEventType.Purchase, TrackingChannel.Server, "{}", Guid.NewGuid()).Value;
        var log = trackingEvent.QueueDispatch(AdProvider.Meta);

        for (var i = 0; i < 5; i++)
        {
            log.MarkProcessing();
            log.MarkFailed(10, 500, "error", "boom");
        }
        Assert.Equal(DispatchStatus.DeadLettered, log.Status);

        var result = trackingEvent.ReplayDispatch(log.Id);

        Assert.True(result.IsSuccess);
        Assert.Equal(DispatchStatus.Pending, log.Status);
        Assert.Null(log.NextRetryAt);
    }
}
