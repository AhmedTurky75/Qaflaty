namespace Qaflaty.Application.Storefront.DTOs;

public record WishlistDto(
    Guid Id,
    Guid CustomerId,
    List<WishlistItemDto> Items,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record WishlistItemDto(
    Guid Id,
    Guid ProductId,
    Guid? VariantId,
    DateTime AddedAt
);
