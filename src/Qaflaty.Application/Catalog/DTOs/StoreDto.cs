namespace Qaflaty.Application.Catalog.DTOs;

public record StoreDto(
    Guid Id,
    string Slug,
    string Name,
    string? Description,
    StoreBrandingDto Branding,
    string Status,
    DeliverySettingsDto DeliverySettings,
    string? CustomDomain,
    DateTime CreatedAt
);

public record StoreBrandingDto(
    string? LogoUrl,
    string PrimaryColor
);

public record MoneyDto(
    decimal Amount,
    string Currency = "SAR"
);

public record DeliverySettingsDto(
    MoneyDto DeliveryFee,
    MoneyDto? FreeDeliveryThreshold
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
