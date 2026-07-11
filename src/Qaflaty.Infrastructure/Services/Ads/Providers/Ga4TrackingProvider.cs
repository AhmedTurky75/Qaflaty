using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Infrastructure.Services.Ads.Providers;

/// <summary>
/// Strategy slot for Google Analytics 4 (gtag.js browser + Measurement Protocol server).
/// Not yet implemented — wire up the GA4 Measurement Protocol the same way
/// <see cref="MetaTrackingProvider"/> wires the Graph API, then remove this stub's
/// "not implemented" responses.
/// </summary>
public sealed class Ga4TrackingProvider : ITrackingProvider
{
    public AdProvider Provider => AdProvider.GoogleAnalytics4;

    public Task<Result> VerifyAsync(ProviderCredentialSet credentials, CancellationToken ct)
        => Task.FromResult(Result.Failure(new Error("Ads.Ga4.NotImplemented", "GA4 integration is coming soon")));

    public Task<ProviderDispatchResult> SendAsync(TrackingEventPayload payload, ProviderCredentialSet credentials, CancellationToken ct)
        => Task.FromResult(ProviderDispatchResult.Failure(null, null, "GA4 integration is coming soon", 0));
}
