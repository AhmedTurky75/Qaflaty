namespace Qaflaty.Domain.Catalog.Enums;

public enum PageType
{
    Home,
    Products,
    ProductDetail,
    About,
    Contact,
    FAQ,
    Terms,
    Privacy,
    ShippingReturns,
    Cart,
    Custom,
    ProductLanding,

    // Layout groups. These are not pages a shopper visits — they hold the
    // sections that make up the header and footer shown around every page.
    Header,
    Footer
}
