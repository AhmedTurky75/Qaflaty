using FluentValidation;

namespace Qaflaty.Application.Catalog.Commands.DeleteCustomPage;

public class DeleteCustomPageCommandValidator : AbstractValidator<DeleteCustomPageCommand>
{
    public DeleteCustomPageCommandValidator()
    {
        RuleFor(x => x.PageId)
            .NotEmpty().WithMessage("PageId is required");
    }
}
