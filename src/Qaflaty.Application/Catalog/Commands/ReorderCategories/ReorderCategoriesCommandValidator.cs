using FluentValidation;

namespace Qaflaty.Application.Catalog.Commands.ReorderCategories;

public class ReorderCategoriesCommandValidator : AbstractValidator<ReorderCategoriesCommand>
{
    public ReorderCategoriesCommandValidator()
    {
        RuleFor(x => x.StoreId)
            .NotEmpty().WithMessage("Store ID is required");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("At least one category is required");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.CategoryId)
                .NotEmpty().WithMessage("Category ID is required");

            item.RuleFor(i => i.SortOrder)
                .GreaterThanOrEqualTo(0).WithMessage("Sort order must be non-negative");
        });
    }
}
