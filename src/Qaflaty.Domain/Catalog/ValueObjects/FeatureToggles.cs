using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class FeatureToggles : ValueObject
{
    public bool Wishlist { get; private set; } // Enables the customer wishlist feature on the storefront
    public bool Reviews { get; private set; } // Enables product reviews & ratings
    public bool PromoCodes { get; private set; } // Enables promo/discount code entry at checkout
    public bool Newsletter { get; private set; } // Enables newsletter signup capture
    public bool ProductSearch { get; private set; } // Enables the product search bar (on by default)
    public bool SocialLinks { get; private set; } // Enables display of social media links in the storefront
    public bool Analytics { get; private set; } // Enables analytics/tracking integration

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
