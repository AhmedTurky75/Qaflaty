using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.Aggregates.Merchant;

namespace Qaflaty.Domain.Identity.Repositories;

public interface IMerchantRepository
{
    Task<Merchant?> GetByIdAsync(MerchantId id, CancellationToken ct = default);
    Task<Merchant?> GetByEmailAsync(Email email, CancellationToken ct = default);
    Task<bool> ExistsByEmailAsync(Email email, CancellationToken ct = default);
    Task<Merchant?> GetByUsernameAsync(string username, CancellationToken ct = default);
    Task<bool> ExistsByUsernameAsync(string username, CancellationToken ct = default);
    Task AddAsync(Merchant merchant, CancellationToken ct = default);
    void Update(Merchant merchant);
    Task<RefreshToken?> GetRefreshTokenAsync(string token, CancellationToken ct = default);
    Task<List<MerchantStoreAssignment>> GetStoreAssignmentsAsync(MerchantId merchantId, CancellationToken ct = default);
    Task<Merchant?> GetByIdWithAssignmentsAsync(MerchantId id, CancellationToken ct = default);
    Task<List<Merchant>> GetByIdsAsync(IEnumerable<MerchantId> ids, CancellationToken ct = default);
    Task<List<Merchant>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default);
}
