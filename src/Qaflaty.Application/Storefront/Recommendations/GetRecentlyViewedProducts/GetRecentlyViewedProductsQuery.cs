using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Recommendations.GetRecentlyViewedProducts;

public record GetRecentlyViewedProductsQuery(
    StoreId StoreId,
    StoreCustomerId? CustomerId,
    string? SessionId,
    int Take = 8
) : IQuery<IReadOnlyList<ProductPublicDto>>;
