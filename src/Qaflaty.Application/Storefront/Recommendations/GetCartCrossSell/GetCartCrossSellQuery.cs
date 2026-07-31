using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Storefront.Recommendations.GetCartCrossSell;

public record GetCartCrossSellQuery(
    CartOwnerContext Owner,
    int Take = 4
) : IQuery<IReadOnlyList<ProductPublicDto>>;
