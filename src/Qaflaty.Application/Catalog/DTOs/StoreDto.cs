namespace Qaflaty.Application.Catalog.DTOs;

public record StoreDto(
    Guid Id,
    Guid MerchantId,
    string Slug,
    string Name,
    string? Description,
    StoreBrandingDto Branding,
    string Status,
    bool IsMaintenanceMode,
    DeliverySettingsDto DeliverySettings,
    string? CustomDomain,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string Currency = "EGP",
    string CurrencySymbol = "ج.م"
);

public record StoreBrandingDto(
    string? LogoUrl,
    string PrimaryColor,
    string? SecondaryLogoUrl = null,
    string? FaviconUrl = null,
    string? AppleTouchIconUrl = null,
    string? OgImageUrl = null,
    string? SecondaryColor = null
);

public record MoneyDto(
    decimal Amount,
    string Currency = "EGP"
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
    string Slug,
    string Name,
    string? Description,
    StoreBrandingDto Branding,
    string Status,
    DeliverySettingsDto DeliverySettings,
    string Currency = "EGP",
    string CurrencySymbol = "ج.م"
);
