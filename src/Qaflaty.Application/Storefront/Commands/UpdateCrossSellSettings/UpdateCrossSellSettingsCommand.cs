using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Commands.UpdateCrossSellSettings;

public record UpdateCrossSellSettingsCommand(
    StoreId StoreId,
    bool Enabled,
    int Limit,
    bool ExcludeOutOfStock
) : ICommand;
