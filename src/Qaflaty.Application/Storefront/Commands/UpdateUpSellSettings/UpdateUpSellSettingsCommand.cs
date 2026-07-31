using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Commands.UpdateUpSellSettings;

public record UpdateUpSellSettingsCommand(
    StoreId StoreId,
    bool Enabled,
    int Limit,
    bool ExcludeOutOfStock
) : ICommand;
