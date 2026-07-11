using System.Text.Json;
using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Application.Ads.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Ads.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Ads.Queries.GetStorefrontTrackingConfig;

/// <summary>Only ever exposes the public, non-secret subset of a provider's credentials (e.g. "pixelId") — never access tokens.</summary>
public class GetStorefrontTrackingConfigQueryHandler : IQueryHandler<GetStorefrontTrackingConfigQuery, List<TrackingPixelConfigDto>>
{
    private static readonly HashSet<string> PublicKeys = new(StringComparer.OrdinalIgnoreCase) { "pixelId", "measurementId", "conversionId" };

    private readonly IProviderIntegrationRepository _integrationRepository;
    private readonly ICredentialProtector _credentialProtector;

    public GetStorefrontTrackingConfigQueryHandler(IProviderIntegrationRepository integrationRepository, ICredentialProtector credentialProtector)
    {
        _integrationRepository = integrationRepository;
        _credentialProtector = credentialProtector;
    }

    public async Task<Result<List<TrackingPixelConfigDto>>> Handle(GetStorefrontTrackingConfigQuery request, CancellationToken cancellationToken)
    {
        var storeId = StoreId.From(request.StoreId);
        var integrations = await _integrationRepository.GetByStoreIdAsync(storeId, cancellationToken);

        var dtos = new List<TrackingPixelConfigDto>();
        // IsDispatchable so the browser pixel keeps loading even if server-side dispatch has
        // errored — the two channels are independent, and a CAPI failure shouldn't blind the pixel.
        foreach (var integration in integrations.Where(i => i.IsDispatchable && i.BrowserTrackingEnabled))
        {
            try
            {
                var plaintext = _credentialProtector.Unprotect(integration.ProtectedCredentialsJson);
                var values = JsonSerializer.Deserialize<Dictionary<string, string>>(plaintext) ?? [];
                var publicConfig = values
                    .Where(kvp => PublicKeys.Contains(kvp.Key))
                    .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);

                if (publicConfig.Count > 0)
                    dtos.Add(new TrackingPixelConfigDto(integration.Provider.ToString(), publicConfig));
            }
            catch
            {
                // Skip a provider whose credentials can't be decrypted rather than failing the whole page load.
            }
        }

        return Result.Success(dtos);
    }
}
