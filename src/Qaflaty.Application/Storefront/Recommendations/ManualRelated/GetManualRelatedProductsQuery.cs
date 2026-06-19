using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Recommendations.ManualRelated;

public record ManualRelatedProductsDto(
    bool Manual,
    IReadOnlyList<ProductPublicDto> Selected
);

public record GetManualRelatedProductsQuery(
    StoreId StoreId,
    ProductId ProductId
) : IQuery<ManualRelatedProductsDto>;
