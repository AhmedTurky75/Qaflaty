using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Ads.Abstractions;

/// <summary>Runs a provider's connectivity check (e.g. a lightweight Graph API call) and updates the integration's status.</summary>
public interface IProviderVerifier
{
    Task<Result> VerifyAsync(StoreId storeId, AdProvider provider, CancellationToken ct);
}
