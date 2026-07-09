using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Domain.Ads.Enums;

namespace Qaflaty.Infrastructure.Services.Ads;

public sealed class TrackingProviderResolver : ITrackingProviderResolver
{
    private readonly IEnumerable<ITrackingProvider> _providers;

    public TrackingProviderResolver(IEnumerable<ITrackingProvider> providers)
    {
        _providers = providers;
    }

    public ITrackingProvider? Resolve(AdProvider provider) => _providers.FirstOrDefault(p => p.Provider == provider);
}
