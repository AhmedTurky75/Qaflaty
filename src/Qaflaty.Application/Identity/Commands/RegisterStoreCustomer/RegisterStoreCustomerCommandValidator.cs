using FluentValidation;

namespace Qaflaty.Application.Identity.Commands.RegisterStoreCustomer;

public class RegisterStoreCustomerCommandValidator : AbstractValidator<RegisterStoreCustomerCommand>
{
    public RegisterStoreCustomerCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Email must be a valid email address")
            .MaximumLength(255).WithMessage("Email must not exceed 255 characters");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters")
            .Matches(@"[A-Z]").WithMessage("Password must contain at least one uppercase letter")
            .Matches(@"[a-z]").WithMessage("Password must contain at least one lowercase letter")
            .Matches(@"[0-9]").WithMessage("Password must contain at least one number");

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required")
            .MinimumLength(2).WithMessage("Full name must be at least 2 characters")
            .MaximumLength(100).WithMessage("Full name must not exceed 100 characters");

        RuleFor(x => x.Phone)
            .Matches(@"^\+?[0-9]{10,20}$").WithMessage("Phone must be between 10 and 20 digits")
            .When(x => !string.IsNullOrWhiteSpace(x.Phone));
    }
}
