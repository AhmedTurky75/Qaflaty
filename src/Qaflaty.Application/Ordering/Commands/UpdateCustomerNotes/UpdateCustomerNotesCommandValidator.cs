using FluentValidation;

namespace Qaflaty.Application.Ordering.Commands.UpdateCustomerNotes;

public class UpdateCustomerNotesCommandValidator : AbstractValidator<UpdateCustomerNotesCommand>
{
    public UpdateCustomerNotesCommandValidator()
    {
        RuleFor(x => x.CustomerId)
            .NotEmpty().WithMessage("Customer ID is required");

        RuleFor(x => x.Note)
            .NotEmpty().WithMessage("Note is required")
            .MaximumLength(1000).WithMessage("Note must not exceed 1000 characters");
    }
}
