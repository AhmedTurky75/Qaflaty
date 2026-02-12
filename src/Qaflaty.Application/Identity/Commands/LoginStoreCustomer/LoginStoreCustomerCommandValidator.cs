using FluentValidation;

namespace Qaflaty.Application.Identity.Commands.LoginStoreCustomer;

public class LoginStoreCustomerCommandValidator : AbstractValidator<LoginStoreCustomerCommand>
{
    public LoginStoreCustomerCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Email must be a valid email address");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required");
    }
}
