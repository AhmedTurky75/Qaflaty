using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.UpdateProductVariant;

public record UpdateProductVariantCommand(
    ProductId ProductId,
    Guid VariantId,
    string Sku,
    decimal? PriceOverride,
    string? PriceOverrideCurrency,
    bool AllowBackorder
) : ICommand;
