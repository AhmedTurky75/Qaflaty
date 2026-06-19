using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Commands.ModerateProductReview;

public enum ReviewModerationAction
{
    Approve = 1,
    Reject = 2,
    Hide = 3,
    Pin = 4,
    Unpin = 5
}

public record ModerateProductReviewCommand(
    ProductReviewId ReviewId,
    StoreId StoreId,
    ReviewModerationAction Action
) : ICommand;
