using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Ads.Abstractions;

/// <summary>
/// Fans a server-channel event out to every provider the store has enabled for server
/// tracking, deduplicating by (StoreId, EventKey, Channel) so retries/replays never
/// double-send. Browser-channel events are logged only — the browser already fired the
/// pixel client-side before the payload reached the backend.
/// </summary>
public interface IEventDispatcher
{
    Task DispatchAsync(TrackingEventPayload payload, CancellationToken ct);

    /// <summary>Re-attempts a single provider's dispatch log (manual Replay or the automatic retry sweep).</summary>
    Task RedispatchAsync(TrackingEventId trackingEventId, Guid dispatchLogId, CancellationToken ct);
}
