using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Catalog.Aggregates.Store;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class StoreRepository : IStoreRepository
{
    private readonly QaflatyDbContext _context;

    public StoreRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<Store?> GetByIdAsync(StoreId id, CancellationToken ct = default)
        => await _context.Stores.FirstOrDefaultAsync(s => s.Id == id, ct);

    public async Task<Store?> GetBySlugAsync(StoreSlug slug, CancellationToken ct = default)
        => await _context.Stores.FirstOrDefaultAsync(s => s.Slug.Value == slug.Value, ct);

    public async Task<Store?> GetByCustomDomainAsync(string domain, CancellationToken ct = default)
        => await _context.Stores.FirstOrDefaultAsync(s => s.CustomDomain == domain, ct);

    public async Task<IReadOnlyList<Store>> GetByMerchantIdAsync(MerchantId merchantId, CancellationToken ct = default)
        => await _context.Stores.Where(s => s.MerchantId == merchantId).ToListAsync(ct);

    public async Task<IReadOnlyList<Store>> GetAccessibleByMerchantIdAsync(MerchantId merchantId, CancellationToken ct = default)
    {
        var assignedStoreIds = _context.MerchantStoreAssignments
            .Where(a => a.MerchantId == merchantId && a.IsActive)
            .Select(a => a.StoreId);

        return await _context.Stores
            .Where(s => s.MerchantId == merchantId || assignedStoreIds.Contains(s.Id))
            .ToListAsync(ct);
    }

    public async Task<bool> CanMerchantAccessStoreAsync(MerchantId merchantId, StoreId storeId, CancellationToken ct = default)
    {
        var isOwner = await _context.Stores
            .AnyAsync(s => s.Id == storeId && s.MerchantId == merchantId, ct);
        if (isOwner)
            return true;

        return await _context.MerchantStoreAssignments
            .AnyAsync(a => a.StoreId == storeId && a.MerchantId == merchantId && a.IsActive, ct);
    }

    public async Task<bool> IsSlugAvailableAsync(StoreSlug slug, StoreId? excludeId = null, CancellationToken ct = default)
    {
        var query = _context.Stores.Where(s => s.Slug.Value == slug.Value);
        if (excludeId.HasValue)
            query = query.Where(s => s.Id != excludeId.Value);
        return !await query.AnyAsync(ct);
    }

    public async Task AddAsync(Store store, CancellationToken ct = default)
        => await _context.Stores.AddAsync(store, ct);

    public void Update(Store store)
        => _context.Stores.Update(store);

    public void Delete(Store store)
        => _context.Stores.Remove(store);
}
