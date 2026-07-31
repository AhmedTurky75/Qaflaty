using FluentValidation;

namespace Qaflaty.Application.Ordering.Commands.ReleaseBlockedOrder;

public class ReleaseBlockedOrderCommandValidator : AbstractValidator<ReleaseBlockedOrderCommand>
{
    public ReleaseBlockedOrderCommandValidator()
    {
        RuleFor(x => x.StoreId)
            .NotEmpty().WithMessage("Store ID is required");

        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("Order ID is required");
    }
}
