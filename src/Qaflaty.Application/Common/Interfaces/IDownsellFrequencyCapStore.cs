using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Common.Interfaces;

/// <summary>
/// Server-side, session-scoped frequency cap for downsell impressions. Enforced here (not on the
/// client) so a page refresh or repeated request cannot bypass "show at most N times" / "wait at
/// least M seconds between shows" — the whole point of a frequency cap.
/// </summary>
public interface IDownsellFrequencyCapStore
{
    /// <summary>
    /// Atomically checks whether another downsell impression is allowed for this session right
    /// now, and if so records it (incrementing the count and resetting the cooldown clock).
    /// Returns false when the session has already reached <paramref name="maxShowsPerSession"/>
    /// impressions, or the last impression was shown less than <paramref name="minIntervalSeconds"/>
    /// ago.
    /// </summary>
    bool TryRecordImpression(
        StoreId storeId, string sessionKey, int maxShowsPerSession, int minIntervalSeconds);
}
