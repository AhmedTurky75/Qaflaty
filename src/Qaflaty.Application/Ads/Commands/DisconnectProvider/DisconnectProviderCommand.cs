using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Ads.Enums;

namespace Qaflaty.Application.Ads.Commands.DisconnectProvider;

public record DisconnectProviderCommand(Guid StoreId, AdProvider Provider) : ICommand;
