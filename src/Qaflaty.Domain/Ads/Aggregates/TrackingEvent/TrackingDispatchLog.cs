using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Ads.Aggregates.TrackingEvent;

/// <summary>
/// One provider's dispatch attempt history for a single <see cref="TrackingEvent"/>.
/// A tracking event fans out to every enabled provider, so it owns one log per provider.
/// </summary>
public sealed class TrackingDispatchLog : Entity<Guid>
{
    private const int MaxAttemptsBeforeDeadLetter = 5;

    private static readonly TimeSpan[] BackoffSteps =
    [
        TimeSpan.FromSeconds(30),
        TimeSpan.FromMinutes(2),
        TimeSpan.FromMinutes(10),
        TimeSpan.FromHours(1),
        TimeSpan.FromHours(6)
    ];

    public AdProvider Provider { get; private set; } // Which provider this dispatch attempt history is for
    public DispatchStatus Status { get; private set; } // Current state of this provider's delivery of the event
    public int AttemptCount { get; private set; } // Number of send attempts made so far
    public DateTime? LastAttemptAt { get; private set; } // UTC timestamp of the most recent attempt
    public DateTime? NextRetryAt { get; private set; } // UTC timestamp when TrackingRetryWorker should retry, if Pending/Failed
    public int? DurationMs { get; private set; } // Wall-clock duration of the last attempt in milliseconds
    public int? ResponseStatus { get; private set; } // HTTP status code returned by the provider on the last attempt
    public string? ResponseBody { get; private set; } // Truncated raw response body, kept for diagnostics/timeline display
    public string? ErrorMessage { get; private set; } // Human-readable error from the last failed attempt
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private TrackingDispatchLog() : base(Guid.Empty) { }

    public static TrackingDispatchLog Create(AdProvider provider)
    {
        return new TrackingDispatchLog
        {
            Id = Guid.NewGuid(),
            Provider = provider,
            Status = DispatchStatus.Pending,
            AttemptCount = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public void MarkProcessing()
    {
        Status = DispatchStatus.Processing;
        AttemptCount++;
        LastAttemptAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkSucceeded(int durationMs, int? responseStatus, string? responseBody)
    {
        Status = DispatchStatus.Succeeded;
        DurationMs = durationMs;
        ResponseStatus = responseStatus;
        ResponseBody = Truncate(responseBody);
        ErrorMessage = null;
        NextRetryAt = null;
        UpdatedAt = DateTime.UtcNow;
    }

    public Result MarkFailed(int durationMs, int? responseStatus, string? responseBody, string errorMessage)
    {
        DurationMs = durationMs;
        ResponseStatus = responseStatus;
        ResponseBody = Truncate(responseBody);
        ErrorMessage = errorMessage;
        UpdatedAt = DateTime.UtcNow;

        if (AttemptCount >= MaxAttemptsBeforeDeadLetter)
        {
            Status = DispatchStatus.DeadLettered;
            NextRetryAt = null;
        }
        else
        {
            Status = DispatchStatus.Failed;
            var step = BackoffSteps[Math.Min(AttemptCount - 1, BackoffSteps.Length - 1)];
            NextRetryAt = DateTime.UtcNow.Add(step);
        }

        return Result.Success();
    }

    /// <summary>Resets a dead-lettered or failed log so <c>TrackingRetryWorker</c> picks it up again.</summary>
    public Result Replay()
    {
        Status = DispatchStatus.Pending;
        NextRetryAt = null;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    private static string? Truncate(string? value, int maxLength = 4000)
        => string.IsNullOrEmpty(value) || value.Length <= maxLength ? value : value[..maxLength];
}
