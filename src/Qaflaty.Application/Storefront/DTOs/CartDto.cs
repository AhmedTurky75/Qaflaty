namespace Qaflaty.Application.Storefront.DTOs;

public record CartDto(
    Guid Id,
    Guid CustomerId,
    List<CartItemDto> Items,
    int TotalItems,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CartItemDto(
    Guid Id,
    Guid ProductId,
    Guid? VariantId,
    int Quantity,
    DateTime AddedAt,
    DateTime UpdatedAt
);
