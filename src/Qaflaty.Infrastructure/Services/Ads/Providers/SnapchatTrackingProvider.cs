using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Infrastructure.Services.Ads.Providers;

/// <summary>
/// Strategy slot for Snapchat Pixel + Conversions API. Not yet implemented — wire up
/// Snapchat's Conversions API the same way <see cref="MetaTrackingProvider"/> wires the
/// Graph API, then remove this stub's "not implemented" responses.
/// </summary>
public sealed class SnapchatTrackingProvider : ITrackingProvider
{
    public AdProvider Provider => AdProvider.Snapchat;

    public Task<Result> VerifyAsync(ProviderCredentialSet credentials, CancellationToken ct)
        => Task.FromResult(Result.Failure(new Error("Ads.Snapchat.NotImplemented", "Snapchat integration is coming soon")));

    public Task<ProviderDispatchResult> SendAsync(TrackingEventPayload payload, ProviderCredentialSet credentials, CancellationToken ct)
        => Task.FromResult(ProviderDispatchResult.Failure(null, null, "Snapchat integration is coming soon", 0));
}
