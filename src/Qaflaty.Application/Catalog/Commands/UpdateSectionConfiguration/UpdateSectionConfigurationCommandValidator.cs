using FluentValidation;

namespace Qaflaty.Application.Catalog.Commands.UpdateSectionConfiguration;

public class UpdateSectionConfigurationCommandValidator : AbstractValidator<UpdateSectionConfigurationCommand>
{
    public UpdateSectionConfigurationCommandValidator()
    {
        RuleFor(x => x.PageId)
            .NotEmpty().WithMessage("PageId is required");

        RuleFor(x => x.Sections)
            .NotNull().WithMessage("Sections list is required");
    }
}
