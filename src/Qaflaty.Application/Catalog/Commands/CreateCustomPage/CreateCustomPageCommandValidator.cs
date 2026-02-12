using FluentValidation;

namespace Qaflaty.Application.Catalog.Commands.CreateCustomPage;

public class CreateCustomPageCommandValidator : AbstractValidator<CreateCustomPageCommand>
{
    public CreateCustomPageCommandValidator()
    {
        RuleFor(x => x.StoreId)
            .NotEmpty().WithMessage("StoreId is required");

        RuleFor(x => x.Title.Arabic)
            .NotEmpty().WithMessage("Arabic title is required");

        RuleFor(x => x.Title.English)
            .NotEmpty().WithMessage("English title is required");

        RuleFor(x => x.Slug)
            .NotEmpty().WithMessage("Slug is required")
            .Matches(@"^[a-z0-9]+(?:-[a-z0-9]+)*$")
            .WithMessage("Slug must be lowercase alphanumeric with hyphens only");
    }
}
