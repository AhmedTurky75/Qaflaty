using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Catalog.Aggregates.PromoCode;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class PromoCodeRepository : IPromoCodeRepository
{
    private readonly QaflatyDbContext _context;

    public PromoCodeRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<PromoCode?> GetByIdAsync(PromoCodeId id, CancellationToken ct = default)
        => await _context.PromoCodes.FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<PromoCode?> GetByCodeAsync(StoreId storeId, string code, CancellationToken ct = default)
    {
        var normalized = code.Trim().ToUpperInvariant();
        return await _context.PromoCodes
            .FirstOrDefaultAsync(p => p.StoreId == storeId && p.Code == normalized, ct);
    }

    public async Task<IReadOnlyList<PromoCode>> GetByStoreAsync(StoreId storeId, CancellationToken ct = default)
        => await _context.PromoCodes
            .Where(p => p.StoreId == storeId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(ct);

    public async Task<bool> CodeExistsAsync(StoreId storeId, string code, CancellationToken ct = default)
    {
        var normalized = code.Trim().ToUpperInvariant();
        return await _context.PromoCodes
            .AnyAsync(p => p.StoreId == storeId && p.Code == normalized, ct);
    }

    public async Task<int> CountCustomerRedemptionsAsync(
        PromoCodeId promoCodeId, CustomerId customerId, CancellationToken ct = default)
        => await _context.PromoCodeRedemptions
            .CountAsync(r => r.PromoCodeId == promoCodeId && r.CustomerId == customerId, ct);

    public async Task AddAsync(PromoCode promoCode, CancellationToken ct = default)
        => await _context.PromoCodes.AddAsync(promoCode, ct);

    public void Update(PromoCode promoCode)
        => _context.PromoCodes.Update(promoCode);

    public void Delete(PromoCode promoCode)
        => _context.PromoCodes.Remove(promoCode);

    public async Task AddRedemptionAsync(PromoCodeRedemption redemption, CancellationToken ct = default)
        => await _context.PromoCodeRedemptions.AddAsync(redemption, ct);
}
