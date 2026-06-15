namespace Qaflaty.Application.Catalog.DTOs;

public record StoreConfigurationDto(
    Guid Id,
    Guid StoreId,
    PageTogglesDto PageToggles,
    FeatureTogglesDto FeatureToggles,
    CustomerAuthSettingsDto CustomerAuthSettings,
    CommunicationSettingsDto CommunicationSettings,
    LocalizationSettingsDto LocalizationSettings,
    SocialLinksDto SocialLinks,
    string HeaderVariant,
    string FooterVariant,
    string ProductCardVariant,
    string ProductGridVariant,
    SearchSettingsDto SearchSettings,
    List<PaymentMethodAdjustmentDto> PaymentMethodAdjustments,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record PageTogglesDto(
    bool AboutPage, bool ContactPage, bool FaqPage,
    bool TermsPage, bool PrivacyPage, bool ShippingReturnsPage, bool CartPage);

public record FeatureTogglesDto(
    bool Wishlist, bool Reviews, bool PromoCodes,
    bool Newsletter, bool ProductSearch, bool SocialLinks, bool Analytics);

public record CustomerAuthSettingsDto(
    string Mode,
    bool AllowGuestCheckout,
    bool RequireEmailVerification,
    bool RequireOtpOnPlaceOrder);

public record CommunicationSettingsDto(
    bool WhatsAppEnabled, string? WhatsAppNumber, string? WhatsAppDefaultMessage,
    bool LiveChatEnabled, bool AiChatbotEnabled, string? AiChatbotName);

public record LocalizationSettingsDto(string DefaultLanguage, bool EnableBilingual, string DefaultDirection);

public record SocialLinksDto(
    string? Facebook, string? Instagram, string? Twitter,
    string? TikTok, string? Snapchat, string? YouTube);

public record PaymentMethodAdjustmentDto(
    Guid Id,
    string PaymentMethod,
    string AdjustmentType,
    decimal Value,
    string? DisplayLabel,
    bool IsEnabled,
    string DefaultLabel,
    string DefaultDescription);

public record PaymentMethodOptionDto(string Key, string DefaultLabel, string DefaultDescription);

public record SearchSettingsDto(
    bool EnableTextSearch,
    bool EnableCategoryFilter,
    bool EnablePriceFilter,
    bool EnablePropertyFilters,
    List<Guid> FilterablePropertyDefinitionIds,
    List<string> AllowedSortOptions);

public record FilterablePropertyDefinitionDto(
    Guid Id,
    string Name,
    string DisplayName,
    string Type,
    List<string> Options);

// Public storefront DTO combining store + configuration
public record StorefrontConfigDto(
    Guid StoreId,
    string Slug,
    string Name,
    string? Description,
    StoreBrandingDto Branding,
    DeliverySettingsDto DeliverySettings,
    PageTogglesDto PageToggles,
    FeatureTogglesDto FeatureToggles,
    CustomerAuthSettingsDto CustomerAuthSettings,
    CommunicationSettingsDto CommunicationSettings,
    LocalizationSettingsDto LocalizationSettings,
    SocialLinksDto SocialLinks,
    string HeaderVariant,
    string FooterVariant,
    string ProductCardVariant,
    string ProductGridVariant,
    bool IsUnderMaintenance,
    SearchSettingsDto SearchSettings,
    List<PaymentMethodAdjustmentDto> PaymentMethodAdjustments,
    List<FilterablePropertyDefinitionDto> FilterablePropertyDefinitions
);
