using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Analytics.Abstractions;

/// <summary>
/// Tracks which stores currently have at least one merchant watching their live dashboard, keyed
/// by SignalR connection so disconnects clean up correctly. The presence sweeper consults this so
/// it only computes and pushes metrics for stores someone is actually looking at — no wasted work
/// (or DB reads) for stores with visitors but no watching merchant. Singleton, per API instance
/// (connections are instance-local; each instance's sweeper serves its own watchers).
/// </summary>
public interface IPresenceSubscriberRegistry
{
    void Subscribe(string connectionId, StoreId storeId);
    void Unsubscribe(string connectionId, StoreId storeId);

    /// <summary>Drops all of a connection's subscriptions — call from the hub's OnDisconnectedAsync.</summary>
    void RemoveConnection(string connectionId);

    IReadOnlyCollection<StoreId> GetWatchedStoreIds();
}
