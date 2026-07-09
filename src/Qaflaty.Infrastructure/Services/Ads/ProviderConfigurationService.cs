using System.Text.Json;
using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Ads.Repositories;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Services.Ads;

public sealed class ProviderConfigurationService : IProviderConfiguration
{
    private readonly IProviderIntegrationRepository _integrationRepository;
    private readonly ICredentialProtector _credentialProtector;

    public ProviderConfigurationService(IProviderIntegrationRepository integrationRepository, ICredentialProtector credentialProtector)
    {
        _integrationRepository = integrationRepository;
        _credentialProtector = credentialProtector;
    }

    public async Task<ProviderCredentialSet?> GetCredentialsAsync(StoreId storeId, AdProvider provider, CancellationToken ct)
    {
        var integration = await _integrationRepository.GetByStoreAndProviderAsync(storeId, provider, ct);
        if (integration == null || !integration.IsActive)
            return null;

        var plaintext = _credentialProtector.Unprotect(integration.ProtectedCredentialsJson);
        var values = JsonSerializer.Deserialize<Dictionary<string, string>>(plaintext) ?? [];
        return new ProviderCredentialSet(values);
    }
}
