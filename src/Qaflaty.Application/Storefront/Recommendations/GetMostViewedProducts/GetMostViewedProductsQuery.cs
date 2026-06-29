using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Recommendations.GetMostViewedProducts;

/// <summary>
/// Most-viewed products for a store. When <paramref name="Days"/> is set the
/// window is limited (e.g. 7 days = "trending"); otherwise it is all-time.
/// </summary>
public record GetMostViewedProductsQuery(
    StoreId StoreId,
    int? Days = null,
    int Take = 8
) : IQuery<IReadOnlyList<ProductPublicDto>>;
