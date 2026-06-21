using Qaflaty.Domain.Catalog.Aggregates.PromoCode;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Domain.Catalog.Repositories;

public interface IPromoCodeRepository
{
    Task<PromoCode?> GetByIdAsync(PromoCodeId id, CancellationToken ct = default);

    /// <summary>Resolves a code (case-insensitive) within a store.</summary>
    Task<PromoCode?> GetByCodeAsync(StoreId storeId, string code, CancellationToken ct = default);

    Task<IReadOnlyList<PromoCode>> GetByStoreAsync(StoreId storeId, CancellationToken ct = default);

    Task<bool> CodeExistsAsync(StoreId storeId, string code, CancellationToken ct = default);

    /// <summary>How many times a given customer has already redeemed a specific code.</summary>
    Task<int> CountCustomerRedemptionsAsync(
        PromoCodeId promoCodeId, CustomerId customerId, CancellationToken ct = default);

    Task AddAsync(PromoCode promoCode, CancellationToken ct = default);
    void Update(PromoCode promoCode);
    void Delete(PromoCode promoCode);

    Task AddRedemptionAsync(PromoCodeRedemption redemption, CancellationToken ct = default);
}
