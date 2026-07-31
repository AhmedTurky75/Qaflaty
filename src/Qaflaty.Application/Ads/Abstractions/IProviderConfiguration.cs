using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Ads.Abstractions;

/// <summary>Resolves and decrypts a store's credentials for one provider, for use by the dispatch pipeline.</summary>
public interface IProviderConfiguration
{
    Task<ProviderCredentialSet?> GetCredentialsAsync(StoreId storeId, AdProvider provider, CancellationToken ct);
}
