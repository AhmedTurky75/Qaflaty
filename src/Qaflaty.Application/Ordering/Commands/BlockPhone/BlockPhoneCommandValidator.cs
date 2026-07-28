using FluentValidation;

namespace Qaflaty.Application.Ordering.Commands.BlockPhone;

public class BlockPhoneCommandValidator : AbstractValidator<BlockPhoneCommand>
{
    public BlockPhoneCommandValidator()
    {
        RuleFor(x => x.StoreId)
            .NotEmpty().WithMessage("Store ID is required");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone number is required");

        RuleFor(x => x.CountryCode)
            .NotEmpty().WithMessage("Country code is required")
            .Length(2).WithMessage("Country code must be a 2-letter ISO 3166-1 alpha-2 code");

        RuleFor(x => x.Reason)
            .MaximumLength(500).WithMessage("Reason must not exceed 500 characters");
    }
}
