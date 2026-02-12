using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.PageConfiguration;

public sealed class PageConfiguration : AggregateRoot<PageConfigurationId>
{
    private readonly List<SectionConfiguration> _sections = [];

    public StoreId StoreId { get; private set; }
    public PageType PageType { get; private set; }
    public string Slug { get; private set; } = null!;
    public BilingualText Title { get; private set; } = null!;
    public bool IsEnabled { get; private set; }
    public PageSeoSettings SeoSettings { get; private set; } = null!;
    public string? ContentJson { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    public IReadOnlyList<SectionConfiguration> Sections => _sections.AsReadOnly();

    private PageConfiguration() : base(PageConfigurationId.Empty) { }

    public static Result<PageConfiguration> Create(
        StoreId storeId,
        PageType pageType,
        string slug,
        BilingualText title,
        bool isEnabled = true)
    {
        var page = new PageConfiguration
        {
            Id = PageConfigurationId.New(),
            StoreId = storeId,
            PageType = pageType,
            Slug = slug,
            Title = title,
            IsEnabled = isEnabled,
            SeoSettings = PageSeoSettings.CreateDefault(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        return Result.Success(page);
    }

    public Result UpdateInfo(BilingualText title, string slug, string? contentJson)
    {
        Title = title;
        Slug = slug;
        ContentJson = contentJson;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result UpdateSeoSettings(PageSeoSettings seoSettings)
    {
        SeoSettings = seoSettings;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result Enable()
    {
        IsEnabled = true;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result Disable()
    {
        IsEnabled = false;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public SectionConfiguration AddSection(
        SectionType sectionType, string variantId, bool isEnabled, int sortOrder,
        string? contentJson = null, string? settingsJson = null)
    {
        var section = SectionConfiguration.Create(
            Id, sectionType, variantId, isEnabled, sortOrder, contentJson, settingsJson);
        _sections.Add(section);
        UpdatedAt = DateTime.UtcNow;
        return section;
    }

    public void RemoveSection(SectionConfigurationId sectionId)
    {
        var section = _sections.FirstOrDefault(s => s.Id == sectionId);
        if (section != null)
        {
            _sections.Remove(section);
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public void ReorderSections(IEnumerable<SectionConfigurationId> orderedIds)
    {
        var order = 0;
        foreach (var id in orderedIds)
        {
            var section = _sections.FirstOrDefault(s => s.Id == id);
            section?.UpdateSortOrder(order++);
        }
        UpdatedAt = DateTime.UtcNow;
    }

    public void ClearSections()
    {
        _sections.Clear();
        UpdatedAt = DateTime.UtcNow;
    }
}
