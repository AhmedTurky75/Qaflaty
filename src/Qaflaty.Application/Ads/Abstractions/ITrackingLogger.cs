using Qaflaty.Domain.Ads.Aggregates.ProviderIntegration;
using Qaflaty.Domain.Ads.Aggregates.TrackingEvent;

namespace Qaflaty.Application.Ads.Abstractions;

/// <summary>Applies a provider dispatch outcome to its <see cref="TrackingDispatchLog"/> row and nudges the provider's rolling health score.</summary>
public interface ITrackingLogger
{
    void Record(TrackingDispatchLog log, ProviderIntegration integration, ProviderDispatchResult result);
}
