using FluentValidation;

namespace Qaflaty.Application.Catalog.Commands.CreateProduct;

public class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
        RuleFor(x => x.StoreId)
            .NotEmpty().WithMessage("Store ID is required");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters");

        RuleFor(x => x.Slug)
            .NotEmpty().WithMessage("Slug is required")
            .Matches(@"^[a-z0-9-]{3,100}$").WithMessage("Slug must be 3-100 characters, lowercase alphanumeric with hyphens");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Price must be greater than zero");

        RuleFor(x => x.CompareAtPrice)
            .GreaterThan(x => x.Price).WithMessage("Compare at price must be greater than price")
            .When(x => x.CompareAtPrice.HasValue);

        RuleFor(x => x.Quantity)
            .GreaterThanOrEqualTo(0).WithMessage("Quantity must be non-negative");
    }
}
