using Qaflaty.Application.Ads.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Ads.Enums;

namespace Qaflaty.Application.Ads.Commands.ConnectProvider;

public record ConnectProviderCommand(
    Guid StoreId,
    AdProvider Provider,
    Dictionary<string, string> Credentials,
    bool BrowserTrackingEnabled,
    bool ServerTrackingEnabled
) : ICommand<ProviderIntegrationDto>;
