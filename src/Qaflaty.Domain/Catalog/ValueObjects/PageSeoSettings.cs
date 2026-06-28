using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class PageSeoSettings : ValueObject
{
    public BilingualText MetaTitle { get; private set; } = null!; // SEO <title> tag text (Arabic + English), e.g. "Home | Qaflaty"
    public BilingualText MetaDescription { get; private set; } = null!; // SEO meta description (Arabic + English) shown in search results
    public string? OgImageUrl { get; private set; } // Open Graph image URL used when the page is shared on social media
    public bool NoIndex { get; private set; } // When true, adds robots noindex so search engines won't index the page
    public bool NoFollow { get; private set; } // When true, adds robots nofollow so links on the page aren't followed

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
