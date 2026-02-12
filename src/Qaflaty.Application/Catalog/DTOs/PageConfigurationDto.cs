namespace Qaflaty.Application.Catalog.DTOs;

public record PageConfigurationDto(
    Guid Id,
    Guid StoreId,
    string PageType,
    string Slug,
    BilingualTextDto Title,
    bool IsEnabled,
    PageSeoSettingsDto SeoSettings,
    string? ContentJson,
    List<SectionConfigurationDto> Sections,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record SectionConfigurationDto(
    Guid Id,
    string SectionType,
    string VariantId,
    bool IsEnabled,
    int SortOrder,
    string? ContentJson,
    string? SettingsJson
);

public record BilingualTextDto(string Arabic, string English);

public record PageSeoSettingsDto(
    BilingualTextDto MetaTitle,
    BilingualTextDto MetaDescription,
    string? OgImageUrl,
    bool NoIndex,
    bool NoFollow
);
