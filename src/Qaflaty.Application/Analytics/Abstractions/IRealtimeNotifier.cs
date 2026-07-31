using Qaflaty.Application.Analytics.DTOs;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Analytics.Abstractions;

/// <summary>
/// Pushes live analytics updates to merchants watching a store's dashboard. Implemented in the
/// API layer over SignalR (the concrete Hub type lives there); Application/Infrastructure code
/// only depends on this abstraction so the transport can change without touching business logic.
/// Implementations must never throw — a failed push must not fail the command that triggered it.
/// </summary>
public interface IRealtimeNotifier
{
    /// <summary>
    /// Pushes the complete, enriched presence snapshot (active users + per-product viewer counts
    /// with product names/images). The client applies it directly — no follow-up HTTP fetch.
    /// </summary>
    Task NotifyPresenceChangedAsync(
        StoreId storeId, int activeUsers, IReadOnlyList<LiveProductViewerDto> productViewers, CancellationToken ct = default);

    /// <summary>
    /// Signals that a store's active carts changed (item added/removed / cart converted). Fired
    /// only on real cart mutations, never on a timer — the watching page re-fetches the cart list
    /// and count in response, which is cheap and always fresh.
    /// </summary>
    Task NotifyActiveCartsChangedAsync(StoreId storeId, CancellationToken ct = default);
}
