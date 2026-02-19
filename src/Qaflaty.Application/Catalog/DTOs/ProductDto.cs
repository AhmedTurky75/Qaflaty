namespace Qaflaty.Application.Catalog.DTOs;

public record ProductDto(
    Guid Id,
    string Slug,
    string Name,
    string? Description,
    decimal Price,
    decimal? CompareAtPrice,
    int Quantity,
    string? Sku,
    bool TrackInventory,
    string Status,
    Guid? CategoryId,
    List<ProductImageDto> Images,
    DateTime CreatedAt
);

public record ProductListDto(
    Guid Id,
    string Slug,
    string Name,
    decimal Price,
    int Quantity,
    string Status,
    string? FirstImageUrl
);

public record ProductPublicDto(
    Guid Id,
    string Slug,
    string Name,
    string? Description,
    decimal Price,
    decimal? CompareAtPrice,
    bool InStock,
    List<ProductImageDto> Images
);

public record ProductImageDto(
    Guid Id,
    string Url,
    string? AltText,
    int SortOrder
);

public record ProductImageInput(
    Guid? Id,
    string Url,
    string? AltText,
    int SortOrder
);
