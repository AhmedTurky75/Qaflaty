using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Domain.Ads.Aggregates.ProviderIntegration;
using Qaflaty.Domain.Ads.Aggregates.TrackingEvent;

namespace Qaflaty.Infrastructure.Services.Ads;

public sealed class TrackingLoggerService : ITrackingLogger
{
    public void Record(TrackingDispatchLog log, ProviderIntegration integration, ProviderDispatchResult result)
    {
        if (result.Succeeded)
        {
            log.MarkSucceeded(result.DurationMs, result.HttpStatus, result.ResponseBody);
            integration.RecordDispatchOutcome(true);
        }
        else
        {
            log.MarkFailed(result.DurationMs, result.HttpStatus, result.ResponseBody, result.ErrorMessage ?? "Unknown error");
            integration.RecordDispatchOutcome(false, result.HttpStatus?.ToString(), result.ErrorMessage);
        }
    }
}
