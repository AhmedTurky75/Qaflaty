using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Infrastructure.Services.Ads.Providers;

/// <summary>
/// Strategy slot for Google Ads Conversion Tracking / Enhanced Conversions. Not yet
/// implemented — wire up the Google Ads API the same way <see cref="MetaTrackingProvider"/>
/// wires the Graph API, then remove this stub's "not implemented" responses.
/// </summary>
public sealed class GoogleAdsTrackingProvider : ITrackingProvider
{
    public AdProvider Provider => AdProvider.GoogleAds;

    public Task<Result> VerifyAsync(ProviderCredentialSet credentials, CancellationToken ct)
        => Task.FromResult(Result.Failure(new Error("Ads.GoogleAds.NotImplemented", "Google Ads integration is coming soon")));

    public Task<ProviderDispatchResult> SendAsync(TrackingEventPayload payload, ProviderCredentialSet credentials, CancellationToken ct)
        => Task.FromResult(ProviderDispatchResult.Failure(null, null, "Google Ads integration is coming soon", 0));
}
