using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Recommendations.GetProductUpSell;

public record GetProductUpSellQuery(
    ProductId ProductId,
    int Take = 4
) : IQuery<IReadOnlyList<ProductPublicDto>>;
