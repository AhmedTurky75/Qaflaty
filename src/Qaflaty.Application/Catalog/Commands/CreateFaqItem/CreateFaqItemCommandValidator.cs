using FluentValidation;

namespace Qaflaty.Application.Catalog.Commands.CreateFaqItem;

public class CreateFaqItemCommandValidator : AbstractValidator<CreateFaqItemCommand>
{
    public CreateFaqItemCommandValidator()
    {
        RuleFor(x => x.StoreId)
            .NotEmpty().WithMessage("StoreId is required");

        RuleFor(x => x.Question.Arabic)
            .NotEmpty().WithMessage("Arabic question is required");

        RuleFor(x => x.Question.English)
            .NotEmpty().WithMessage("English question is required");

        RuleFor(x => x.Answer.Arabic)
            .NotEmpty().WithMessage("Arabic answer is required");

        RuleFor(x => x.Answer.English)
            .NotEmpty().WithMessage("English answer is required");
    }
}
