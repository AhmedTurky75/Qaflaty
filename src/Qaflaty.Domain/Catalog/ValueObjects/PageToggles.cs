using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class PageToggles : ValueObject
{
    public bool AboutPage { get; private set; }
    public bool ContactPage { get; private set; }
    public bool FaqPage { get; private set; }
    public bool TermsPage { get; private set; }
    public bool PrivacyPage { get; private set; }
    public bool ShippingReturnsPage { get; private set; }
    public bool CartPage { get; private set; }

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
