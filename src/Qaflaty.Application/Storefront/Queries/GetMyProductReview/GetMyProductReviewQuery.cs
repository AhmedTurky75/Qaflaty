using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.DTOs;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Queries.GetMyProductReview;

/// <summary>Returns the authenticated customer's own review for a product (any status), or null.</summary>
public record GetMyProductReviewQuery(
    StoreCustomerId CustomerId,
    ProductId ProductId
) : IQuery<ProductReviewDto?>;
