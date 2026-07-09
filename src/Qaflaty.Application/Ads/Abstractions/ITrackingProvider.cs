using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Ads.Abstractions;

/// <summary>
/// Strategy interface implemented once per ad network. Adding a new network (Pinterest,
/// LinkedIn, ...) means implementing this interface and registering it in DI — nothing
/// else in the dispatch pipeline changes.
/// </summary>
public interface ITrackingProvider
{
    AdProvider Provider { get; }

    Task<Result> VerifyAsync(ProviderCredentialSet credentials, CancellationToken ct);

    Task<ProviderDispatchResult> SendAsync(TrackingEventPayload payload, ProviderCredentialSet credentials, CancellationToken ct);
}

public sealed record ProviderDispatchResult(bool Succeeded, int? HttpStatus, string? ResponseBody, string? ErrorMessage, int DurationMs)
{
    public static ProviderDispatchResult Success(int? httpStatus, string? responseBody, int durationMs)
        => new(true, httpStatus, responseBody, null, durationMs);

    public static ProviderDispatchResult Failure(int? httpStatus, string? responseBody, string errorMessage, int durationMs)
        => new(false, httpStatus, responseBody, errorMessage, durationMs);
}
