using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Infrastructure.Services.Ads.Providers;

/// <summary>
/// Strategy slot for TikTok Pixel (browser) + Events API (server). Not yet implemented —
/// wire up TikTok's Events API (https://business-api.tiktok.com/.../event/track/) the same
/// way <see cref="MetaTrackingProvider"/> wires the Graph API, then remove this stub's
/// "not implemented" responses.
/// </summary>
public sealed class TikTokTrackingProvider : ITrackingProvider
{
    public AdProvider Provider => AdProvider.TikTok;

    public Task<Result> VerifyAsync(ProviderCredentialSet credentials, CancellationToken ct)
        => Task.FromResult(Result.Failure(new Error("Ads.TikTok.NotImplemented", "TikTok integration is coming soon")));

    public Task<ProviderDispatchResult> SendAsync(TrackingEventPayload payload, ProviderCredentialSet credentials, CancellationToken ct)
        => Task.FromResult(ProviderDispatchResult.Failure(null, null, "TikTok integration is coming soon", 0));
}
