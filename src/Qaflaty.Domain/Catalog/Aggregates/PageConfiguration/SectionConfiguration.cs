using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.PageConfiguration;

public sealed class SectionConfiguration : Entity<SectionConfigurationId>
{
    public PageConfigurationId PageConfigurationId { get; private set; } // Parent page this section belongs to
    public SectionType SectionType { get; private set; } // Kind of section, e.g. Hero, ProductGrid, Banner, Testimonials
    public string VariantId { get; private set; } = null!; // Selected visual variant of the section type, e.g. "hero-full-image"
    public bool IsEnabled { get; private set; } // Whether this section is rendered on the page
    public int SortOrder { get; private set; } // Vertical position of the section within the page (lower = higher up)
    public string? ContentJson { get; private set; } // Serialized editable content for the section (headings, items, images)
    public string? SettingsJson { get; private set; } // Serialized layout/style settings for the section (colors, spacing, etc.)

    private SectionConfiguration() : base(SectionConfigurationId.Empty) { }

    public static SectionConfiguration Create(
        PageConfigurationId pageConfigurationId,
        SectionType sectionType,
        string variantId,
        bool isEnabled,
        int sortOrder,
        string? contentJson = null,
        string? settingsJson = null)
    {
        return new SectionConfiguration
        {
            Id = SectionConfigurationId.New(),
            PageConfigurationId = pageConfigurationId,
            SectionType = sectionType,
            VariantId = variantId,
            IsEnabled = isEnabled,
            SortOrder = sortOrder,
            ContentJson = contentJson,
            SettingsJson = settingsJson
        };
    }

    public void Update(string variantId, bool isEnabled, int sortOrder,
        string? contentJson, string? settingsJson)
    {
        VariantId = variantId;
        IsEnabled = isEnabled;
        SortOrder = sortOrder;
        ContentJson = contentJson;
        SettingsJson = settingsJson;
    }

    public void UpdateSortOrder(int sortOrder)
    {
        SortOrder = sortOrder;
    }

    public void Enable() => IsEnabled = true;
    public void Disable() => IsEnabled = false;
}
