using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Domain.Communication.Aggregates.AiInteraction;

public interface IAiInteractionLogRepository
{
    Task AddAsync(AiInteractionLog log, CancellationToken ct = default);

    Task AddRangeAsync(IEnumerable<AiInteractionLog> logs, CancellationToken ct = default);

    /// <summary>Returns all interaction logs for a store created at or after the given UTC time.</summary>
    Task<IReadOnlyList<AiInteractionLog>> GetByStoreSinceAsync(
        StoreId storeId, DateTime sinceUtc, CancellationToken ct = default);
}
