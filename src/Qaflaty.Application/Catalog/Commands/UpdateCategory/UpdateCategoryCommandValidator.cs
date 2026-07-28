using FluentValidation;
using Qaflaty.Domain.Catalog.Aggregates.Category;
using Qaflaty.Domain.Catalog.ValueObjects;

namespace Qaflaty.Application.Catalog.Commands.UpdateCategory;

public class UpdateCategoryCommandValidator : AbstractValidator<UpdateCategoryCommand>
{
    public UpdateCategoryCommandValidator()
    {
        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Category ID is required");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(100).WithMessage("Name must not exceed 100 characters");

        RuleFor(x => x.SortOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Sort order must be non-negative")
            .When(x => x.SortOrder.HasValue);

        RuleFor(x => x.ImageUrl)
            .MaximumLength(Category.MaxImageUrlLength)
            .WithMessage($"Image URL must not exceed {Category.MaxImageUrlLength} characters");

        RuleFor(x => x.IconName)
            .MaximumLength(Category.MaxIconNameLength)
            .WithMessage($"Icon name must not exceed {Category.MaxIconNameLength} characters");

        RuleFor(x => x.ContentHtml)
            .MaximumLength(CategoryContent.MaxLength)
            .WithMessage($"Content must not exceed {CategoryContent.MaxLength} characters");

        RuleFor(x => x.ContentHtmlAr)
            .MaximumLength(CategoryContent.MaxLength)
            .WithMessage($"Arabic content must not exceed {CategoryContent.MaxLength} characters");
    }
}
