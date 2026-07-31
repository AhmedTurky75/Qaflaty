namespace Qaflaty.Application.Catalog.DTOs;

/// <summary>
/// One stock line running at or below the merchant's alert threshold. A product without variants
/// contributes a single row; a product with variants contributes one row per variant, because stock
/// is held against the variant rather than the parent product.
/// </summary>
public record LowStockItemDto(
    Guid ProductId,
    string ProductName,
    string Sku,
    int Quantity,
    int Threshold,
    Guid? VariantId = null,
    Dictionary<string, string>? VariantAttributes = null
);
