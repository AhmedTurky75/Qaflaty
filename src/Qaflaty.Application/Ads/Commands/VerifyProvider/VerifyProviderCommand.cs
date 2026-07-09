using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Ads.Enums;

namespace Qaflaty.Application.Ads.Commands.VerifyProvider;

public record VerifyProviderCommand(Guid StoreId, AdProvider Provider) : ICommand;
