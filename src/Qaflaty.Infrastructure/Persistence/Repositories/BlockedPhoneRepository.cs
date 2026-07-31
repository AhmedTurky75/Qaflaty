using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Ordering.Aggregates.BlockedPhone;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class BlockedPhoneRepository : IBlockedPhoneRepository
{
    private readonly QaflatyDbContext _context;

    public BlockedPhoneRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<BlockedPhone?> GetByIdAsync(BlockedPhoneId id, CancellationToken ct = default)
        => await _context.BlockedPhones.FirstOrDefaultAsync(b => b.Id == id, ct);

    public async Task<BlockedPhone?> GetByPhoneAsync(StoreId storeId, PhoneNumber phone, CancellationToken ct = default)
        => await _context.BlockedPhones
            .FirstOrDefaultAsync(b => b.StoreId == storeId && b.Phone.Value == phone.Value, ct);

    public async Task<IReadOnlyList<BlockedPhone>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default)
        => await _context.BlockedPhones
            .Where(b => b.StoreId == storeId)
            .ToListAsync(ct);

    public async Task<(IReadOnlyList<BlockedPhone> Items, int TotalCount)> GetPagedAsync(
        StoreId storeId,
        string? search,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var query = _context.BlockedPhones.Where(b => b.StoreId == storeId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(b =>
                EF.Functions.ILike(b.Phone.Value, $"%{term}%") ||
                (b.Reason != null && EF.Functions.ILike(b.Reason, $"%{term}%")));
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(b => b.BlockedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }

    public async Task AddAsync(BlockedPhone blockedPhone, CancellationToken ct = default)
        => await _context.BlockedPhones.AddAsync(blockedPhone, ct);

    public void Update(BlockedPhone blockedPhone)
        => _context.BlockedPhones.Update(blockedPhone);

    public void Remove(BlockedPhone blockedPhone)
        => _context.BlockedPhones.Remove(blockedPhone);
}
