using System.Text.Json;
using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Ads.Errors;
using Qaflaty.Domain.Ads.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Services.Ads;

public sealed class ProviderVerifierService : IProviderVerifier
{
    private readonly IProviderIntegrationRepository _integrationRepository;
    private readonly ICredentialProtector _credentialProtector;
    private readonly ITrackingProviderResolver _resolver;

    public ProviderVerifierService(
        IProviderIntegrationRepository integrationRepository,
        ICredentialProtector credentialProtector,
        ITrackingProviderResolver resolver)
    {
        _integrationRepository = integrationRepository;
        _credentialProtector = credentialProtector;
        _resolver = resolver;
    }

    public async Task<Result> VerifyAsync(StoreId storeId, AdProvider provider, CancellationToken ct)
    {
        var integration = await _integrationRepository.GetByStoreAndProviderAsync(storeId, provider, ct);
        if (integration == null)
            return Result.Failure(AdsErrors.ProviderNotFound);

        var trackingProvider = _resolver.Resolve(provider);
        if (trackingProvider == null)
            return Result.Failure(new Error("Ads.ProviderNotSupported", "This provider is not yet supported"));

        var plaintext = _credentialProtector.Unprotect(integration.ProtectedCredentialsJson);
        var values = JsonSerializer.Deserialize<Dictionary<string, string>>(plaintext) ?? [];
        var credentials = new ProviderCredentialSet(values);

        var result = await trackingProvider.VerifyAsync(credentials, ct);

        if (result.IsSuccess)
            integration.MarkVerified();
        else
            integration.MarkVerificationFailed(result.Error.Code, result.Error.Message);

        _integrationRepository.Update(integration);
        return result;
    }
}
