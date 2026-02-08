namespace Qaflaty.Application.Catalog.DTOs;

public record StoreDto(
    Guid Id,
    string Slug,
    string Name,
    string? Description,
    string? LogoUrl,
    string PrimaryColor,
    string Status,
    decimal DeliveryFee,
    decimal? FreeDeliveryThreshold,
    string? CustomDomain,
    DateTime CreatedAt
);

public record StoreListDto(
    Guid Id,
    string Slug,
    string Name,
    string Status,
    DateTime CreatedAt
);

public record StorePublicDto(
    Guid Id,
    string Name,
    string? Description,
    string? LogoUrl,
    string PrimaryColor,
    decimal DeliveryFee,
    decimal? FreeDeliveryThreshold
);
