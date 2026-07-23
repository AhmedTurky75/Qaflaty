using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Storefront.Recommendations.GetCartUpSell;

public record GetCartUpSellQuery(
    CartOwnerContext Owner,
    int Take = 4
) : IQuery<IReadOnlyList<ProductPublicDto>>;
