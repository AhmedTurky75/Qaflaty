using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Commands.UpdateProductReview;

public record UpdateProductReviewCommand(
    ProductReviewId ReviewId,
    StoreCustomerId CustomerId,
    int Rating,
    string? Title,
    string? Comment
) : ICommand;
