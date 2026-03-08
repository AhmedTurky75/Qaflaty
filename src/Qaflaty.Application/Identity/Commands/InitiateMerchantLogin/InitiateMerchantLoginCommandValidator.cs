using FluentValidation;

namespace Qaflaty.Application.Identity.Commands.InitiateMerchantLogin;

public class InitiateMerchantLoginCommandValidator : AbstractValidator<InitiateMerchantLoginCommand>
{
    public InitiateMerchantLoginCommandValidator()
    {
        RuleFor(x => x.EmailOrUsername)
            .NotEmpty().WithMessage("Email or username is required");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required");
    }
}
