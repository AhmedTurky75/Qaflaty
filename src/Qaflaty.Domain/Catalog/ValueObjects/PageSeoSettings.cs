using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class PageSeoSettings : ValueObject
{
    public BilingualText MetaTitle { get; private set; } = null!;
    public BilingualText MetaDescription { get; private set; } = null!;
    public string? OgImageUrl { get; private set; }
    public bool NoIndex { get; private set; }
    public bool NoFollow { get; private set; }

    private PageSeoSettings() { }

    public static PageSeoSettings CreateDefault() => new()
    {
        MetaTitle = BilingualText.Empty,
        MetaDescription = BilingualText.Empty,
        NoIndex = false,
        NoFollow = false
    };

    public static PageSeoSettings Create(
        BilingualText metaTitle, BilingualText metaDescription,
        string? ogImageUrl, bool noIndex, bool noFollow) => new()
    {
        MetaTitle = metaTitle,
        MetaDescription = metaDescription,
        OgImageUrl = ogImageUrl,
        NoIndex = noIndex,
        NoFollow = noFollow
    };

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return MetaTitle;
        yield return MetaDescription;
        yield return OgImageUrl;
        yield return NoIndex;
        yield return NoFollow;
    }
}
