using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Infrastructure.Services.Ads.Providers;

/// <summary>
/// Strategy slot for Google Tag Manager server-side container support. Not yet
/// implemented — wire up a GTM server container endpoint the same way
/// <see cref="MetaTrackingProvider"/> wires the Graph API, then remove this stub's
/// "not implemented" responses. GTM's browser side is just container script injection,
/// handled by the storefront <c>TrackingService</c> directly.
/// </summary>
public sealed class GtmTrackingProvider : ITrackingProvider
{
    public AdProvider Provider => AdProvider.GoogleTagManager;

    public Task<Result> VerifyAsync(ProviderCredentialSet credentials, CancellationToken ct)
        => Task.FromResult(Result.Failure(new Error("Ads.Gtm.NotImplemented", "Google Tag Manager server integration is coming soon")));

    public Task<ProviderDispatchResult> SendAsync(TrackingEventPayload payload, ProviderCredentialSet credentials, CancellationToken ct)
        => Task.FromResult(ProviderDispatchResult.Failure(null, null, "Google Tag Manager server integration is coming soon", 0));
}
