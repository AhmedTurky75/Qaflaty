using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.Aggregates.Merchant;
using Qaflaty.Domain.Identity.Repositories;
using Qaflaty.Infrastructure.Persistence;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class MerchantRepository : IMerchantRepository
{
    private readonly QaflatyDbContext _context;

    public MerchantRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<Merchant?> GetByIdAsync(MerchantId id, CancellationToken ct = default)
        => await _context.Merchants
            .Include(m => m.RefreshTokens)
            .FirstOrDefaultAsync(m => m.Id == id, ct);

    public async Task<Merchant?> GetByEmailAsync(Email email, CancellationToken ct = default)
        => await _context.Merchants
            .Include(m => m.RefreshTokens)
            .FirstOrDefaultAsync(m => m.Email.Value == email.Value, ct);

    public async Task<bool> ExistsByEmailAsync(Email email, CancellationToken ct = default)
        => await _context.Merchants.AnyAsync(m => m.Email.Value == email.Value, ct);

    public async Task<Merchant?> GetByUsernameAsync(string username, CancellationToken ct = default)
        => await _context.Merchants
            .Include(m => m.RefreshTokens)
            .FirstOrDefaultAsync(m => m.Username == username, ct);

    public async Task<bool> ExistsByUsernameAsync(string username, CancellationToken ct = default)
        => await _context.Merchants.AnyAsync(m => m.Username == username, ct);

    public async Task AddAsync(Merchant merchant, CancellationToken ct = default)
        => await _context.Merchants.AddAsync(merchant, ct);

    public void Update(Merchant merchant)
        => _context.Merchants.Update(merchant);

    public async Task<RefreshToken?> GetRefreshTokenAsync(string token, CancellationToken ct = default)
        => await _context.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == token, ct);

    public async Task<List<MerchantStoreAssignment>> GetStoreAssignmentsAsync(MerchantId merchantId, CancellationToken ct = default)
        => await _context.MerchantStoreAssignments
            .Where(a => a.MerchantId == merchantId && a.IsActive)
            .ToListAsync(ct);

    public async Task<Merchant?> GetByIdWithAssignmentsAsync(MerchantId id, CancellationToken ct = default)
        => await _context.Merchants
            .Include(m => m.RefreshTokens)
            .Include(m => m.StoreAssignments)
            .FirstOrDefaultAsync(m => m.Id == id, ct);

    public async Task<List<Merchant>> GetByIdsAsync(IEnumerable<MerchantId> ids, CancellationToken ct = default)
    {
        var guidIds = ids.Select(id => id.Value).ToList();
        return await _context.Merchants
            .Where(m => guidIds.Contains(m.Id.Value))
            .ToListAsync(ct);
    }

    public async Task<List<Merchant>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default)
    {
        var merchantIds = await _context.MerchantStoreAssignments
            .Where(a => a.StoreId == storeId)
            .Select(a => a.MerchantId)
            .Distinct()
            .ToListAsync(ct);

        return await _context.Merchants
            .Include(m => m.StoreAssignments)
            .Where(m => merchantIds.Contains(m.Id))
            .ToListAsync(ct);
    }
}
