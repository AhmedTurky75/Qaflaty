using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.PageConfiguration;

/// <summary>
/// An A/B test variant of a page. The page's own <see cref="PageConfiguration.Sections"/>
/// act as the control; each variant carries an alternative section layout as a
/// JSON snapshot plus a traffic weight and simple impression/conversion counters.
/// </summary>
public sealed class PageVariant : Entity<PageVariantId>
{
    public PageConfigurationId PageConfigurationId { get; private set; } // Parent page this variant belongs to
    public string Name { get; private set; } = null!; // Human label, e.g. "B" or "Green button"
    public int Weight { get; private set; } // Relative traffic weight vs the control and other variants
    public bool IsActive { get; private set; } // Whether this variant participates in the split
    public string? SectionsJson { get; private set; } // Serialized alternative section list (SectionConfigurationDto[])
    public long Impressions { get; private set; } // Times this variant was served (placeholder analytics)
    public long Conversions { get; private set; } // Conversions attributed to this variant (placeholder analytics)

    private PageVariant() : base(PageVariantId.Empty) { }

    public static PageVariant Create(
        PageConfigurationId pageConfigurationId,
        string name,
        int weight,
        bool isActive,
        string? sectionsJson)
    {
        return new PageVariant
        {
            Id = PageVariantId.New(),
            PageConfigurationId = pageConfigurationId,
            Name = name,
            Weight = weight < 0 ? 0 : weight,
            IsActive = isActive,
            SectionsJson = sectionsJson,
            Impressions = 0,
            Conversions = 0
        };
    }

    public void Update(string name, int weight, bool isActive, string? sectionsJson)
    {
        Name = name;
        Weight = weight < 0 ? 0 : weight;
        IsActive = isActive;
        SectionsJson = sectionsJson;
    }

    public void RecordImpression() => Impressions++;
    public void RecordConversion() => Conversions++;
}
