using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Commands.DeleteProductReview;

public record DeleteProductReviewCommand(
    ProductReviewId ReviewId,
    StoreCustomerId CustomerId
) : ICommand;
