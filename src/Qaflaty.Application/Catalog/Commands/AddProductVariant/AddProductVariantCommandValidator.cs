using FluentValidation;

namespace Qaflaty.Application.Catalog.Commands.AddProductVariant;

public class AddProductVariantCommandValidator : AbstractValidator<AddProductVariantCommand>
{
    public AddProductVariantCommandValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product ID is required");

        RuleFor(x => x.Attributes)
            .NotEmpty().WithMessage("Variant attributes are required")
            .Must(attrs => attrs != null && attrs.Count > 0)
            .WithMessage("At least one attribute is required");

        RuleFor(x => x.Sku)
            .NotEmpty().WithMessage("SKU is required")
            .MaximumLength(100).WithMessage("SKU must not exceed 100 characters");

        RuleFor(x => x.Quantity)
            .GreaterThanOrEqualTo(0).WithMessage("Quantity cannot be negative");

        RuleFor(x => x.PriceOverride)
            .GreaterThan(0).WithMessage("Price override must be greater than 0")
            .When(x => x.PriceOverride.HasValue);
    }
}
