using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Ads.Abstractions;

public sealed record QueuedDispatch(TrackingEventId TrackingEventId, Guid DispatchLogId, TrackingEventPayload Payload);

/// <summary>
/// In-process delivery queue between event ingestion and <see cref="Infrastructure"/>'s
/// retry worker. Backed by <c>System.Threading.Channels</c> today; swappable for a durable
/// broker later without touching call sites (see docs/ADS_MANAGEMENT.md ,§16).
/// </summary>
public interface IEventQueue
{
    ValueTask EnqueueAsync(QueuedDispatch dispatch, CancellationToken ct);
    IAsyncEnumerable<QueuedDispatch> ReadAllAsync(CancellationToken ct);
}
