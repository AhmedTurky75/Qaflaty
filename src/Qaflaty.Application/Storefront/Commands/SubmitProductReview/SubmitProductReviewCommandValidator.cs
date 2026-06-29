using FluentValidation;

namespace Qaflaty.Application.Storefront.Commands.SubmitProductReview;

public class SubmitProductReviewCommandValidator : AbstractValidator<SubmitProductReviewCommand>
{
    public SubmitProductReviewCommandValidator()
    {
        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5).WithMessage("Rating must be between 1 and 5.");

        RuleFor(x => x.Title)
            .MaximumLength(200).WithMessage("Title must not exceed 200 characters.");

        RuleFor(x => x.Comment)
            .MaximumLength(4000).WithMessage("Comment must not exceed 4000 characters.");

        RuleForEach(x => x.Media).ChildRules(media =>
        {
            media.RuleFor(m => m.Url)
                .NotEmpty().WithMessage("Media URL is required.")
                .MaximumLength(1000);
            media.RuleFor(m => m.Type)
                .Must(t => t is "Image" or "Video")
                .WithMessage("Media type must be 'Image' or 'Video'.");
        }).When(x => x.Media != null);
    }
}
