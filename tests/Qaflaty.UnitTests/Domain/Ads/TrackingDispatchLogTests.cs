using Qaflaty.Domain.Ads.Aggregates.TrackingEvent;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Common.Identifiers;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Ads;

public class TrackingDispatchLogTests
{
    [Fact]
    public void Create_StartsPendingWithNoAttempts()
    {
        var log = TrackingDispatchLog.Create(TrackingEventId.New(), AdProvider.Meta);

        Assert.Equal(DispatchStatus.Pending, log.Status);
        Assert.Equal(0, log.AttemptCount);
        Assert.Null(log.NextRetryAt);
    }

    [Fact]
    public void MarkProcessing_IncrementsAttemptCountAndSetsProcessingStatus()
    {
        var log = TrackingDispatchLog.Create(TrackingEventId.New(), AdProvider.Meta);

        log.MarkProcessing();

        Assert.Equal(DispatchStatus.Processing, log.Status);
        Assert.Equal(1, log.AttemptCount);
        Assert.NotNull(log.LastAttemptAt);
    }

    [Fact]
    public void MarkSucceeded_ClearsErrorAndNextRetry()
    {
        var log = TrackingDispatchLog.Create(TrackingEventId.New(), AdProvider.Meta);
        log.MarkProcessing();
        log.MarkFailed(50, 500, "server error", "boom"); // give it something to clear

        log.MarkProcessing();
        log.MarkSucceeded(80, 200, "{\"success\":true}");

        Assert.Equal(DispatchStatus.Succeeded, log.Status);
        Assert.Null(log.ErrorMessage);
        Assert.Null(log.NextRetryAt);
        Assert.Equal(80, log.DurationMs);
        Assert.Equal(200, log.ResponseStatus);
    }

    [Fact]
    public void MarkFailed_BeforeMaxAttempts_SchedulesExponentialBackoff()
    {
        var log = TrackingDispatchLog.Create(TrackingEventId.New(), AdProvider.Meta);
        var before = DateTime.UtcNow;

        log.MarkProcessing(); // attempt 1
        log.MarkFailed(10, 500, "err", "first failure");

        Assert.Equal(DispatchStatus.Failed, log.Status);
        Assert.NotNull(log.NextRetryAt);
        Assert.True(log.NextRetryAt > before.AddSeconds(20)); // ~30s backoff for attempt 1
    }

    [Fact]
    public void MarkFailed_AtFifthAttempt_DeadLetters()
    {
        var log = TrackingDispatchLog.Create(TrackingEventId.New(), AdProvider.Meta);

        for (var i = 0; i < 4; i++)
        {
            log.MarkProcessing();
            log.MarkFailed(10, 500, "err", "failure " + i);
            Assert.Equal(DispatchStatus.Failed, log.Status);
        }

        log.MarkProcessing(); // 5th attempt
        log.MarkFailed(10, 500, "err", "final failure");

        Assert.Equal(DispatchStatus.DeadLettered, log.Status);
        Assert.Null(log.NextRetryAt);
        Assert.Equal(5, log.AttemptCount);
    }

    [Fact]
    public void Replay_ResetsDeadLetteredLogToPending()
    {
        var log = TrackingDispatchLog.Create(TrackingEventId.New(), AdProvider.Meta);
        for (var i = 0; i < 5; i++)
        {
            log.MarkProcessing();
            log.MarkFailed(10, 500, "err", "failure");
        }

        log.Replay();

        Assert.Equal(DispatchStatus.Pending, log.Status);
        Assert.Null(log.NextRetryAt);
    }
}
