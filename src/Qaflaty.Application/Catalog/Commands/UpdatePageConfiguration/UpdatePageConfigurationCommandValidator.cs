using FluentValidation;

namespace Qaflaty.Application.Catalog.Commands.UpdatePageConfiguration;

public class UpdatePageConfigurationCommandValidator : AbstractValidator<UpdatePageConfigurationCommand>
{
    public UpdatePageConfigurationCommandValidator()
    {
        RuleFor(x => x.PageId)
            .NotEmpty().WithMessage("PageId is required");

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
