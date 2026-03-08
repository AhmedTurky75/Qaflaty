using FluentValidation;

namespace Qaflaty.Application.Identity.Commands.InitiateCustomerLogin;

public class InitiateCustomerLoginCommandValidator : AbstractValidator<InitiateCustomerLoginCommand>
{
    public InitiateCustomerLoginCommandValidator()
    {
        RuleFor(x => x.EmailOrUsername)
            .NotEmpty().WithMessage("Email or username is required");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required");
    }
}
