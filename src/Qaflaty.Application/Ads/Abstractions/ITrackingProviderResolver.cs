using Qaflaty.Domain.Ads.Enums;

namespace Qaflaty.Application.Ads.Abstractions;

/// <summary>Factory that maps an <see cref="AdProvider"/> to its registered <see cref="ITrackingProvider"/> adapter.</summary>
public interface ITrackingProviderResolver
{
    ITrackingProvider? Resolve(AdProvider provider);
}
