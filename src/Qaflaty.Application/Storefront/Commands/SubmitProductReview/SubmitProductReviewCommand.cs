using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Commands.SubmitProductReview;

public record ReviewMediaInput(string Url, string Type);

public record SubmitProductReviewCommand(
    StoreId StoreId,
    ProductId ProductId,
    StoreCustomerId CustomerId,
    int Rating,
    string? Title,
    string? Comment,
    IReadOnlyList<ReviewMediaInput>? Media = null
) : ICommand<Guid>;
