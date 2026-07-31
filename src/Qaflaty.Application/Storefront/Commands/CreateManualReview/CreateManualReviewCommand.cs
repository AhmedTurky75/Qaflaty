using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Storefront.Commands.CreateManualReview;

/// <summary>
/// Creates a merchant-authored ("manual") product review — e.g. seeding curated
/// testimonials. It is stored as a normal, auto-approved review with a synthetic
/// customer id (there is no real customer), so it appears on the storefront
/// alongside genuine reviews and can be moderated like any other.
/// </summary>
public record CreateManualReviewCommand(
    Guid StoreId,
    Guid ProductId,
    string AuthorName,
    int Rating,
    string? Title,
    string? Comment
) : ICommand<Guid>;
