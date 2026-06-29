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
    DateTime AddedAt,
    string ProductName,
    string ProductSlug,
    decimal Price,
    decimal? CompareAtPrice,
    bool InStock,
    string? ImageUrl,
    Dictionary<string, string>? VariantAttributes
);

/// <summary>Merchant analytics: a product ranked by how many times it has been wishlisted.</summary>
public record MostWishlistedProductDto(
    Guid ProductId,
    string ProductName,
    string ProductSlug,
    int WishlistCount,
    string? ImageUrl
);
