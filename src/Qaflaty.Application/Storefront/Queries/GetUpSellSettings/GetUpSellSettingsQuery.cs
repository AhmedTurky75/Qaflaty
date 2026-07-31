using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Queries.GetUpSellSettings;

public record UpSellSettingsDto(bool Enabled, int Limit, bool ExcludeOutOfStock);

public record GetUpSellSettingsQuery(StoreId StoreId) : IQuery<UpSellSettingsDto>;
