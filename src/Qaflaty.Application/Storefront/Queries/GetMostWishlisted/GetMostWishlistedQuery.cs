using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.DTOs;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Queries.GetMostWishlisted;

public record GetMostWishlistedQuery(
    StoreId StoreId,
    int Take = 10
) : IQuery<IReadOnlyList<MostWishlistedProductDto>>;
