using Qaflaty.Domain.Ads.Aggregates.ProviderIntegration;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Domain.Ads.Repositories;

public interface IProviderIntegrationRepository
{
    Task<ProviderIntegration?> GetByIdAsync(ProviderIntegrationId id, CancellationToken ct = default);
    Task<ProviderIntegration?> GetByStoreAndProviderAsync(StoreId storeId, AdProvider provider, CancellationToken ct = default);
    Task<IReadOnlyList<ProviderIntegration>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default);
    Task AddAsync(ProviderIntegration integration, CancellationToken ct = default);
    void Update(ProviderIntegration integration);
}
