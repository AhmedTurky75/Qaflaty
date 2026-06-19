using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.DTOs;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Queries.GetReviewsForModeration;

public record GetReviewsForModerationQuery(
    StoreId StoreId,
    ProductId? ProductId = null,
    string? Status = null   // "Pending" | "Approved" | "Rejected" | "Hidden"
) : IQuery<IReadOnlyList<ReviewModerationDto>>;
