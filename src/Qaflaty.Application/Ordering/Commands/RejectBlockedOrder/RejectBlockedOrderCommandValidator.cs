using FluentValidation;

namespace Qaflaty.Application.Ordering.Commands.RejectBlockedOrder;

public class RejectBlockedOrderCommandValidator : AbstractValidator<RejectBlockedOrderCommand>
{
    public RejectBlockedOrderCommandValidator()
    {
        RuleFor(x => x.StoreId)
            .NotEmpty().WithMessage("Store ID is required");

        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("Order ID is required");

        RuleFor(x => x.Reason)
            .MaximumLength(500).WithMessage("Reason must not exceed 500 characters");
    }
}
