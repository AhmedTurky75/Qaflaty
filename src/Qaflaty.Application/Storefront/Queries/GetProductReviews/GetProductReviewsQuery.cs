using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.DTOs;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Queries.GetProductReviews;

public record GetProductReviewsQuery(
    ProductId ProductId,
    int Page = 1,
    int PageSize = 10,
    string? SortBy = null,       // "recent" | "helpful" | "highest" | "lowest"
    int? FilterStars = null      // 1-5 to show only that star level
) : IQuery<ProductReviewListDto>;
