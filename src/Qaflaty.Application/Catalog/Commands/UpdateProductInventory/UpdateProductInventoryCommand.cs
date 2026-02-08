using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.UpdateProductInventory;

public record UpdateProductInventoryCommand(
    Guid ProductId,
    int Quantity,
    string? Sku,
    bool TrackInventory
) : ICommand;
