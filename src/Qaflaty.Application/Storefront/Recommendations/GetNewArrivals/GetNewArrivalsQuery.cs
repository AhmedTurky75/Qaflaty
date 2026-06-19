using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Recommendations.GetNewArrivals;

public record GetNewArrivalsQuery(
    StoreId StoreId,
    int Take = 8
) : IQuery<IReadOnlyList<ProductPublicDto>>;
