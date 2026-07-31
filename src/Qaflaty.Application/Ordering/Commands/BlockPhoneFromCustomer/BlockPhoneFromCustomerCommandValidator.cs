using FluentValidation;

namespace Qaflaty.Application.Ordering.Commands.BlockPhoneFromCustomer;

public class BlockPhoneFromCustomerCommandValidator : AbstractValidator<BlockPhoneFromCustomerCommand>
{
    public BlockPhoneFromCustomerCommandValidator()
    {
        RuleFor(x => x.StoreId)
            .NotEmpty().WithMessage("Store ID is required");

        RuleFor(x => x.CustomerId)
            .NotEmpty().WithMessage("Customer ID is required");

        RuleFor(x => x.Reason)
            .MaximumLength(500).WithMessage("Reason must not exceed 500 characters");
    }
}
