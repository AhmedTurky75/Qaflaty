using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class PageToggles : ValueObject
{
    public bool AboutPage { get; private set; } // Whether the "About" page is enabled/visible in the storefront
    public bool ContactPage { get; private set; } // Whether the "Contact" page is enabled/visible
    public bool FaqPage { get; private set; } // Whether the "FAQ" page is enabled/visible
    public bool TermsPage { get; private set; } // Whether the "Terms & Conditions" page is enabled/visible
    public bool PrivacyPage { get; private set; } // Whether the "Privacy Policy" page is enabled/visible
    public bool ShippingReturnsPage { get; private set; } // Whether the "Shipping & Returns" page is enabled/visible
    public bool CartPage { get; private set; } // Whether the dedicated cart page is enabled (on by default)

    private PageToggles() { }

    public static PageToggles CreateDefault() => new()
    {
        AboutPage = true,
        ContactPage = true,
        FaqPage = false,
        TermsPage = false,
        PrivacyPage = false,
        ShippingReturnsPage = false,
        CartPage = true
    };

    public static PageToggles Create(
        bool aboutPage, bool contactPage, bool faqPage,
        bool termsPage, bool privacyPage, bool shippingReturnsPage, bool cartPage) => new()
    {
        AboutPage = aboutPage,
        ContactPage = contactPage,
        FaqPage = faqPage,
        TermsPage = termsPage,
        PrivacyPage = privacyPage,
        ShippingReturnsPage = shippingReturnsPage,
        CartPage = cartPage
    };

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return AboutPage;
        yield return ContactPage;
        yield return FaqPage;
        yield return TermsPage;
        yield return PrivacyPage;
        yield return ShippingReturnsPage;
        yield return CartPage;
    }
}
