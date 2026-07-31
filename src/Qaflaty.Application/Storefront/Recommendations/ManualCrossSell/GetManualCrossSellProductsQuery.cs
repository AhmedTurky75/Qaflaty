using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Recommendations.ManualCrossSell;

public record GetManualCrossSellProductsQuery(
    StoreId StoreId,
    ProductId ProductId
) : IQuery<IReadOnlyList<ProductPublicDto>>;
