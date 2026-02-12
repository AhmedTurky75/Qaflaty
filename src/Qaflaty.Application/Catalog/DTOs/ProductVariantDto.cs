namespace Qaflaty.Application.Catalog.DTOs;

public record ProductVariantDto(
    Guid Id,
    Guid ProductId,
    Dictionary<string, string> Attributes,
    string Sku,
    decimal? PriceOverride,
    string? PriceOverrideCurrency,
    int Quantity,
    bool AllowBackorder,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
