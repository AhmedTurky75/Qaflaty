using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Ordering.Aggregates.BlockedPhone;

namespace Qaflaty.Domain.Ordering.Repositories;

public interface IBlockedPhoneRepository
{
    Task<BlockedPhone?> GetByIdAsync(BlockedPhoneId id, CancellationToken ct = default);

    /// <summary>
    /// Looks up a block by exact E.164 match within the store. Returns null when the number is allowed.
    /// </summary>
    Task<BlockedPhone?> GetByPhoneAsync(StoreId storeId, PhoneNumber phone, CancellationToken ct = default);

    /// <summary>
    /// Every block for the store. Used to flag blocked rows in a customer listing without a
    /// per-row lookup.
    /// </summary>
    Task<IReadOnlyList<BlockedPhone>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default);

    /// <summary>
    /// Blocked numbers for the store, newest first. <paramref name="search"/> matches the phone or the reason.
    /// </summary>
    Task<(IReadOnlyList<BlockedPhone> Items, int TotalCount)> GetPagedAsync(
        StoreId storeId,
        string? search,
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task AddAsync(BlockedPhone blockedPhone, CancellationToken ct = default);
    void Update(BlockedPhone blockedPhone);
    void Remove(BlockedPhone blockedPhone);
}
