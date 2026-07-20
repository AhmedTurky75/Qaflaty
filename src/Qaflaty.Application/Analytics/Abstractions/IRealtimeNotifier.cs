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
    /// Carries only the active-user count — per-product viewer data needs product names/images,
    /// which would require a DB hit from the singleton sweeper. The dashboard re-fetches the full
    /// (enriched) snapshot on receipt, the same "push signal, re-fetch" pattern as
    /// <see cref="NotifyActiveCartsChangedAsync"/>.
    /// </summary>
    Task NotifyPresenceChangedAsync(StoreId storeId, int activeUsers, CancellationToken ct = default);

    /// <summary>
    /// Signals that a store's active-cart list changed (item added/removed/cart converted).
    /// Intentionally carries no payload — the merchant dashboard re-fetches the cart list,
    /// keeping the push cheap and avoiding drift between the pushed and persisted state.
    /// </summary>
    Task NotifyActiveCartsChangedAsync(StoreId storeId, CancellationToken ct = default);
}
