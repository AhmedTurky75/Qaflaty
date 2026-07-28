using FluentValidation;

namespace Qaflaty.Application.Ordering.Commands.UnblockPhone;

public class UnblockPhoneCommandValidator : AbstractValidator<UnblockPhoneCommand>
{
    public UnblockPhoneCommandValidator()
    {
        RuleFor(x => x.StoreId)
            .NotEmpty().WithMessage("Store ID is required");

        RuleFor(x => x.BlockedPhoneId)
            .NotEmpty().WithMessage("Blocked phone ID is required");
    }
}
