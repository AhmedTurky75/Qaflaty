using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Queries.GetCrossSellSettings;

public record CrossSellSettingsDto(bool Enabled, int Limit, bool ExcludeOutOfStock);

public record GetCrossSellSettingsQuery(StoreId StoreId) : IQuery<CrossSellSettingsDto>;
