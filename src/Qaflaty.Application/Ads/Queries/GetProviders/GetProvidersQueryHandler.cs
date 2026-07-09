using System.Text.Json;
using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Application.Ads.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Ads.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Ads.Queries.GetProviders;

public class GetProvidersQueryHandler : IQueryHandler<GetProvidersQuery, List<ProviderIntegrationDto>>
{
    private readonly IProviderIntegrationRepository _integrationRepository;
    private readonly ICredentialProtector _credentialProtector;

    public GetProvidersQueryHandler(IProviderIntegrationRepository integrationRepository, ICredentialProtector credentialProtector)
    {
        _integrationRepository = integrationRepository;
        _credentialProtector = credentialProtector;
    }

    public async Task<Result<List<ProviderIntegrationDto>>> Handle(GetProvidersQuery request, CancellationToken cancellationToken)
    {
        var storeId = StoreId.From(request.StoreId);
        var integrations = await _integrationRepository.GetByStoreIdAsync(storeId, cancellationToken);

        var dtos = integrations.Select(i =>
        {
            Dictionary<string, string> masked;
            try
            {
                var plaintext = _credentialProtector.Unprotect(i.ProtectedCredentialsJson);
                var values = JsonSerializer.Deserialize<Dictionary<string, string>>(plaintext) ?? [];
                masked = CredentialMasking.Mask(values);
            }
            catch
            {
                masked = [];
            }

            return new ProviderIntegrationDto(
                i.Id.Value,
                i.Provider.ToString(),
                i.Status.ToString(),
                i.BrowserTrackingEnabled,
                i.ServerTrackingEnabled,
                i.HealthScore,
                i.LastEventAt,
                i.LastErrorCode,
                i.LastErrorMessage,
                i.LastVerifiedAt,
                masked);
        }).ToList();

        return Result.Success(dtos);
    }
}
