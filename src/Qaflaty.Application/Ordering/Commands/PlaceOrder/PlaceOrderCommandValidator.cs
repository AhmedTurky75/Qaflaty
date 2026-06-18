using FluentValidation;

namespace Qaflaty.Application.Ordering.Commands.PlaceOrder;

public class PlaceOrderCommandValidator : AbstractValidator<PlaceOrderCommand>
{
    public PlaceOrderCommandValidator()
    {
        RuleFor(x => x.StoreId)
            .NotEmpty().WithMessage("Store ID is required");

        RuleFor(x => x.CustomerName)
            .NotEmpty().WithMessage("Customer name is required")
            .MinimumLength(2).WithMessage("Customer name must be at least 2 characters")
            .MaximumLength(100).WithMessage("Customer name must not exceed 100 characters");

        RuleFor(x => x.CustomerPhone)
            .NotEmpty().WithMessage("Customer phone is required")
            .Matches(@"^\+?[\d]{10,20}$").WithMessage("Phone must be between 10 and 20 digits");

        RuleFor(x => x.CustomerEmail)
            .NotEmpty().WithMessage("Email is required to verify your order")
            .EmailAddress().WithMessage("Email must be a valid email address");

        RuleFor(x => x.Street)
            .NotEmpty().WithMessage("Street is required");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("City is required");

        // The payment method is a store-configured key (e.g. "COD", "Visa"), not a
        // PaymentMethod enum name. The handler validates the key against the store's
        // enabled payment methods, so here we only require a value to be present.
        RuleFor(x => x.PaymentMethod)
            .NotEmpty().WithMessage("Payment method is required");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("Order must have at least one item");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductId)
                .NotEmpty().WithMessage("Product ID is required");

            item.RuleFor(i => i.Quantity)
                .GreaterThan(0).WithMessage("Quantity must be greater than zero");
        });
    }
}
