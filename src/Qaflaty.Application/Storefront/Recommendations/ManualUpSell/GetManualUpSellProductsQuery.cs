using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Recommendations.ManualUpSell;

public record GetManualUpSellProductsQuery(
    StoreId StoreId,
    ProductId ProductId
) : IQuery<IReadOnlyList<ProductPublicDto>>;
