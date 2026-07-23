using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Recommendations.ManualDownSell;

public record DownsellOfferDto(
    IReadOnlyList<ProductPublicDto> DownsellProducts,
    Guid? PromoCodeId,
    string? PromoCode,
    bool IsEnabled);

public record GetDownsellOfferQuery(StoreId StoreId, ProductId ProductId) : IQuery<DownsellOfferDto>;
