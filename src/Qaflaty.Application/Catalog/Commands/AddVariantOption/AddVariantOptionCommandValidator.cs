using FluentValidation;

namespace Qaflaty.Application.Catalog.Commands.AddVariantOption;

public class AddVariantOptionCommandValidator : AbstractValidator<AddVariantOptionCommand>
{
    public AddVariantOptionCommandValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product ID is required");

        RuleFor(x => x.OptionName)
            .NotEmpty().WithMessage("Option name is required")
            .MaximumLength(50).WithMessage("Option name must not exceed 50 characters");

        RuleFor(x => x.OptionValues)
            .NotEmpty().WithMessage("At least one option value is required")
            .Must(values => values != null && values.Count > 0)
            .WithMessage("Option values list cannot be empty");
    }
}
