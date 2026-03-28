namespace Qaflaty.Application.Storefront.DTOs;

public record CartDto(
    Guid Id,
    Guid? CustomerId,
    string? GuestId,
    List<CartItemDetailsDto> Items,
    int TotalItems,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CartItemDetailsDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string ProductSlug,
    Guid? VariantId,
    Dictionary<string, string>? VariantAttributes,
    decimal UnitPrice,
    string Currency,
    int Quantity,
    string? ImageUrl,
    int MaxQuantity,
    DateTime AddedAt,
    DateTime UpdatedAt
);
