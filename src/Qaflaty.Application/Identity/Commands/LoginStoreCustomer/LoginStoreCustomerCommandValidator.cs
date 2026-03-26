using FluentValidation;

namespace Qaflaty.Application.Identity.Commands.LoginStoreCustomer;

public class LoginStoreCustomerCommandValidator : AbstractValidator<LoginStoreCustomerCommand>
{
    public LoginStoreCustomerCommandValidator()
    {
        RuleFor(x => x.EmailOrUsername)
            .NotEmpty().WithMessage("Email or username is required");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required");
    }
}
