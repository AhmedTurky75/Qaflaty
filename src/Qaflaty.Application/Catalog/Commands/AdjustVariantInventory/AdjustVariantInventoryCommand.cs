using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.AdjustVariantInventory;

public record AdjustVariantInventoryCommand(
    ProductId ProductId,
    Guid VariantId,
    int QuantityChange,
    InventoryMovementType MovementType,
    string Reason
) : ICommand;
