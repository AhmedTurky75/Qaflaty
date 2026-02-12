using FluentValidation;

namespace Qaflaty.Application.Catalog.Commands.DeleteFaqItem;

public class DeleteFaqItemCommandValidator : AbstractValidator<DeleteFaqItemCommand>
{
    public DeleteFaqItemCommandValidator()
    {
        RuleFor(x => x.FaqItemId)
            .NotEmpty().WithMessage("FaqItemId is required");
    }
}
