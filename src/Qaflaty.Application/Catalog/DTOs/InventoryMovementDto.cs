namespace Qaflaty.Application.Catalog.DTOs;

public record InventoryMovementDto(
    Guid Id,
    Guid ProductId,
    Guid? VariantId,
    int QuantityChange,
    int QuantityAfter,
    string Type,
    string Reason,
    Guid? OrderId,
    DateTime CreatedAt
);
