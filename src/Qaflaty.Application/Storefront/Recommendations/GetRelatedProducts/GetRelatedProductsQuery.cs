using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Recommendations.GetRelatedProducts;

public record GetRelatedProductsQuery(
    ProductId ProductId,
    int Take = 8
) : IQuery<IReadOnlyList<ProductPublicDto>>;
