using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.AddProductVariant;

public record AddProductVariantCommand(
    ProductId ProductId,
    Dictionary<string, string> Attributes,
    string Sku,
    decimal? PriceOverride,
    string? PriceOverrideCurrency,
    int Quantity,
    bool AllowBackorder
) : ICommand<Guid>;
