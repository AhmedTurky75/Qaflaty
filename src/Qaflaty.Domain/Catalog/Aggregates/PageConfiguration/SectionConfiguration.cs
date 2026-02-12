using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.PageConfiguration;

public sealed class SectionConfiguration : Entity<SectionConfigurationId>
{
    public PageConfigurationId PageConfigurationId { get; private set; }
    public SectionType SectionType { get; private set; }
    public string VariantId { get; private set; } = null!;
    public bool IsEnabled { get; private set; }
    public int SortOrder { get; private set; }
    public string? ContentJson { get; private set; }
    public string? SettingsJson { get; private set; }

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
