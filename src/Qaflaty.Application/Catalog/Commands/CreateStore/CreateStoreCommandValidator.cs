using FluentValidation;

namespace Qaflaty.Application.Catalog.Commands.CreateStore;

public class CreateStoreCommandValidator : AbstractValidator<CreateStoreCommand>
{
    public CreateStoreCommandValidator()
    {
        RuleFor(x => x.Slug)
            .NotEmpty().WithMessage("Slug is required")
            .Matches(@"^[a-z][a-z0-9-]{1,48}[a-z0-9]$").WithMessage("Slug must be 3-50 characters, lowercase alphanumeric with hyphens");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(100).WithMessage("Name must not exceed 100 characters");

        RuleFor(x => x.PrimaryColor)
            .Matches(@"^#[0-9A-Fa-f]{6}$").WithMessage("Primary color must be a valid hex color")
            .When(x => !string.IsNullOrEmpty(x.PrimaryColor));

        RuleFor(x => x.DeliveryFee)
            .GreaterThanOrEqualTo(0).WithMessage("Delivery fee must be non-negative");

        RuleFor(x => x.FreeDeliveryThreshold)
            .GreaterThan(x => x.DeliveryFee).WithMessage("Free delivery threshold must be greater than delivery fee")
            .When(x => x.FreeDeliveryThreshold.HasValue);
    }
}
