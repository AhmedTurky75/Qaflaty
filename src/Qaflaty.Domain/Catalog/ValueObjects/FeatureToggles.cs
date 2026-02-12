using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class FeatureToggles : ValueObject
{
    public bool Wishlist { get; private set; }
    public bool Reviews { get; private set; }
    public bool PromoCodes { get; private set; }
    public bool Newsletter { get; private set; }
    public bool ProductSearch { get; private set; }
    public bool SocialLinks { get; private set; }
    public bool Analytics { get; private set; }

    private FeatureToggles() { }

    public static FeatureToggles CreateDefault() => new()
    {
        Wishlist = false,
        Reviews = false,
        PromoCodes = false,
        Newsletter = false,
        ProductSearch = true,
        SocialLinks = false,
        Analytics = false
    };

    public static FeatureToggles Create(
        bool wishlist, bool reviews, bool promoCodes,
        bool newsletter, bool productSearch, bool socialLinks, bool analytics) => new()
    {
        Wishlist = wishlist,
        Reviews = reviews,
        PromoCodes = promoCodes,
        Newsletter = newsletter,
        ProductSearch = productSearch,
        SocialLinks = socialLinks,
        Analytics = analytics
    };

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Wishlist;
        yield return Reviews;
        yield return PromoCodes;
        yield return Newsletter;
        yield return ProductSearch;
        yield return SocialLinks;
        yield return Analytics;
    }
}
