using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Commands.UpdateDownsellSettings;

public record UpdateDownsellSettingsCommand(
    StoreId StoreId,
    bool Enabled,
    int MaxShowsPerSession,
    int MinIntervalSeconds,
    bool ExcludeOutOfStock
) : ICommand;
