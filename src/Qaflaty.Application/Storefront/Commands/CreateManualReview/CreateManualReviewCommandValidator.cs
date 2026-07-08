using FluentValidation;

namespace Qaflaty.Application.Storefront.Commands.CreateManualReview;

public class CreateManualReviewCommandValidator : AbstractValidator<CreateManualReviewCommand>
{
    public CreateManualReviewCommandValidator()
    {
        RuleFor(x => x.StoreId).NotEmpty();
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.AuthorName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Rating).InclusiveBetween(1, 5);
        RuleFor(x => x.Title).MaximumLength(200);
        RuleFor(x => x.Comment).MaximumLength(4000);
    }
}
