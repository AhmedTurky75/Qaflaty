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
        if (integration == null || !integration.IsDispatchable)
            return null;

        try
        {
            var plaintext = _credentialProtector.Unprotect(integration.ProtectedCredentialsJson);
            var values = JsonSerializer.Deserialize<Dictionary<string, string>>(plaintext) ?? [];
            return new ProviderCredentialSet(values);
        }
        catch (Exception)
        {
            // A decrypt/parse failure (e.g. the Data Protection key that encrypted this token is
            // gone) must not crash dispatch — return null so the caller records a clean, actionable
            // "reconnect this provider" failure instead of a 500.
            return null;
        }
    }
}
