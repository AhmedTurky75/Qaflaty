using FluentValidation;

namespace Qaflaty.Application.Catalog.Commands.ReorderFaqItems;

public class ReorderFaqItemsCommandValidator : AbstractValidator<ReorderFaqItemsCommand>
{
    public ReorderFaqItemsCommandValidator()
    {
        RuleFor(x => x.StoreId)
            .NotEmpty().WithMessage("StoreId is required");

        RuleFor(x => x.OrderedIds)
            .NotNull().WithMessage("OrderedIds list is required")
            .NotEmpty().WithMessage("OrderedIds list cannot be empty");
    }
}
