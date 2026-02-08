using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.UpdateProductPricing;

public record UpdateProductPricingCommand(
    Guid ProductId,
    decimal Price,
    decimal? CompareAtPrice
) : ICommand;
