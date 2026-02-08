using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.Aggregates.Merchant;

namespace Qaflaty.Domain.Identity.Repositories;

public interface IMerchantRepository
{
    Task<Merchant?> GetByIdAsync(MerchantId id, CancellationToken ct = default);
    Task<Merchant?> GetByEmailAsync(Email email, CancellationToken ct = default);
    Task<bool> ExistsByEmailAsync(Email email, CancellationToken ct = default);
    Task AddAsync(Merchant merchant, CancellationToken ct = default);
    void Update(Merchant merchant);
    Task<RefreshToken?> GetRefreshTokenAsync(string token, CancellationToken ct = default);
}
