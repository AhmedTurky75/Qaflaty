using FluentValidation;

namespace Qaflaty.Application.Ordering.Commands.AddOrderNote;

public class AddOrderNoteCommandValidator : AbstractValidator<AddOrderNoteCommand>
{
    public AddOrderNoteCommandValidator()
    {
        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("Order ID is required");

        RuleFor(x => x.Note)
            .NotEmpty().WithMessage("Note is required")
            .MaximumLength(1000).WithMessage("Note must not exceed 1000 characters");
    }
}
