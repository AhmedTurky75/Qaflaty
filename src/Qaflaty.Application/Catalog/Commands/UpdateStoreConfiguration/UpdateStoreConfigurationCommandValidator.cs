using FluentValidation;

namespace Qaflaty.Application.Catalog.Commands.UpdateStoreConfiguration;

public class UpdateStoreConfigurationCommandValidator : AbstractValidator<UpdateStoreConfigurationCommand>
{
    public UpdateStoreConfigurationCommandValidator()
    {
        RuleFor(x => x.StoreId)
            .NotEmpty().WithMessage("StoreId is required");

        RuleFor(x => x.HeaderVariant)
            .NotEmpty().WithMessage("HeaderVariant is required");

        RuleFor(x => x.FooterVariant)
            .NotEmpty().WithMessage("FooterVariant is required");

        RuleFor(x => x.ProductCardVariant)
            .NotEmpty().WithMessage("ProductCardVariant is required");

        RuleFor(x => x.ProductGridVariant)
            .NotEmpty().WithMessage("ProductGridVariant is required");

        RuleFor(x => x.AiAssistantSettings)
            .NotNull().WithMessage("AiAssistantSettings is required");

        When(x => x.AiAssistantSettings is not null, () =>
        {
            RuleFor(x => x.AiAssistantSettings.AssistantName)
                .MaximumLength(50).WithMessage("Assistant name must be 50 characters or fewer");

            RuleFor(x => x.AiAssistantSettings.WelcomeMessage)
                .MaximumLength(500).WithMessage("Welcome message must be 500 characters or fewer");

            RuleFor(x => x.AiAssistantSettings.EnabledHoursStart)
                .InclusiveBetween(0, 23).WithMessage("Enabled hours start must be between 0 and 23")
                .When(x => x.AiAssistantSettings.EnabledHoursStart is not null);

            RuleFor(x => x.AiAssistantSettings.EnabledHoursEnd)
                .InclusiveBetween(0, 23).WithMessage("Enabled hours end must be between 0 and 23")
                .When(x => x.AiAssistantSettings.EnabledHoursEnd is not null);
        });
    }
}
