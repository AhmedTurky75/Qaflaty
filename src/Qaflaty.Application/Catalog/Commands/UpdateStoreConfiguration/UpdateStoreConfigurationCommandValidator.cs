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
    }
}
