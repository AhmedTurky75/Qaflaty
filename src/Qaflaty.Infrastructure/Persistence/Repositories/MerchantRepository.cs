using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.Aggregates.Merchant;
using Qaflaty.Domain.Identity.Repositories;

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

    public async Task AddAsync(Merchant merchant, CancellationToken ct = default)
        => await _context.Merchants.AddAsync(merchant, ct);

    public void Update(Merchant merchant)
        => _context.Merchants.Update(merchant);

    public async Task<RefreshToken?> GetRefreshTokenAsync(string token, CancellationToken ct = default)
        => await _context.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == token, ct);
}
