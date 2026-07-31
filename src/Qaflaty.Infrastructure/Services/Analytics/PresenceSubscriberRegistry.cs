using System.Collections.Concurrent;
using Qaflaty.Application.Analytics.Abstractions;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Services.Analytics;

/// <summary>
/// In-memory, per-instance implementation of <see cref="IPresenceSubscriberRegistry"/>. A store is
/// "watched" while at least one connection is subscribed to it; a store-keyed reference count is
/// maintained so overlapping subscriptions and disconnects net out correctly. Mutations are
/// infrequent (subscribe / unsubscribe / disconnect) so a single lock keeps the two maps
/// consistent without fuss.
/// </summary>
public class PresenceSubscriberRegistry : IPresenceSubscriberRegistry
{
    private readonly object _gate = new();
    private readonly Dictionary<string, HashSet<Guid>> _byConnection = new();
    private readonly Dictionary<Guid, int> _storeRefCounts = new();

    public void Subscribe(string connectionId, StoreId storeId)
    {
        lock (_gate)
        {
            if (!_byConnection.TryGetValue(connectionId, out var stores))
                _byConnection[connectionId] = stores = new HashSet<Guid>();

            if (stores.Add(storeId.Value))
                _storeRefCounts[storeId.Value] = _storeRefCounts.GetValueOrDefault(storeId.Value) + 1;
        }
    }

    public void Unsubscribe(string connectionId, StoreId storeId)
    {
        lock (_gate)
        {
            if (_byConnection.TryGetValue(connectionId, out var stores) && stores.Remove(storeId.Value))
            {
                Decrement(storeId.Value);
                if (stores.Count == 0)
                    _byConnection.Remove(connectionId);
            }
        }
    }

    public void RemoveConnection(string connectionId)
    {
        lock (_gate)
        {
            if (!_byConnection.TryGetValue(connectionId, out var stores))
                return;

            foreach (var storeGuid in stores)
                Decrement(storeGuid);

            _byConnection.Remove(connectionId);
        }
    }

    public IReadOnlyCollection<StoreId> GetWatchedStoreIds()
    {
        lock (_gate)
        {
            return _storeRefCounts.Keys.Select(g => new StoreId(g)).ToList();
        }
    }

    // Caller holds _gate.
    private void Decrement(Guid storeGuid)
    {
        var next = _storeRefCounts.GetValueOrDefault(storeGuid) - 1;
        if (next <= 0)
            _storeRefCounts.Remove(storeGuid);
        else
            _storeRefCounts[storeGuid] = next;
    }
}
