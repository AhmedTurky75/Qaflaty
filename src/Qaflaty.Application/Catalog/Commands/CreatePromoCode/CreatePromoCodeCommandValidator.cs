using FluentValidation;

namespace Qaflaty.Application.Catalog.Commands.CreatePromoCode;

public class CreatePromoCodeCommandValidator : AbstractValidator<CreatePromoCodeCommand>
{
    private static readonly string[] AllowedTypes = ["Percentage", "FixedAmount", "FreeShipping"];

    public CreatePromoCodeCommandValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Promo code is required.")
            .MaximumLength(40);

        RuleFor(x => x.Description)
            .MaximumLength(500);

        RuleFor(x => x.DiscountType)
            .Must(t => AllowedTypes.Contains(t))
            .WithMessage("Discount type must be 'Percentage', 'FixedAmount' or 'FreeShipping'.");

        RuleFor(x => x.Value)
            .GreaterThan(0).When(x => x.DiscountType != "FreeShipping")
            .WithMessage("Discount value must be greater than zero.");

        RuleFor(x => x.Value)
            .LessThanOrEqualTo(100).When(x => x.DiscountType == "Percentage")
            .WithMessage("Percentage value cannot exceed 100.");

        RuleFor(x => x.MinimumOrderAmount)
            .GreaterThanOrEqualTo(0).When(x => x.MinimumOrderAmount.HasValue);

        RuleFor(x => x.MaxDiscountAmount)
            .GreaterThan(0).When(x => x.MaxDiscountAmount.HasValue);

        RuleFor(x => x.UsageLimit)
            .GreaterThan(0).When(x => x.UsageLimit.HasValue);

        RuleFor(x => x.UsageLimitPerCustomer)
            .GreaterThan(0).When(x => x.UsageLimitPerCustomer.HasValue);

        RuleFor(x => x.ExpiresAt)
            .GreaterThan(x => x.StartsAt!.Value)
            .When(x => x.StartsAt.HasValue && x.ExpiresAt.HasValue)
            .WithMessage("Expiry must be after the start date.");
    }
}
