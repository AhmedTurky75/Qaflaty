using MediatR;
using Qaflaty.Domain.Catalog.Aggregates.PageConfiguration;
using Qaflaty.Domain.Catalog.Aggregates.Store.Events;
using Qaflaty.Domain.Catalog.Aggregates.StoreConfiguration;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;

namespace Qaflaty.Application.Catalog.EventHandlers;

public class StoreCreatedSeedConfigHandler : INotificationHandler<StoreCreatedEvent>
{
    private readonly IStoreConfigurationRepository _configRepo;
    private readonly IPageConfigurationRepository _pageRepo;

    public StoreCreatedSeedConfigHandler(
        IStoreConfigurationRepository configRepo,
        IPageConfigurationRepository pageRepo)
    {
        _configRepo = configRepo;
        _pageRepo = pageRepo;
    }

    public async Task Handle(StoreCreatedEvent notification, CancellationToken cancellationToken)
    {
        // Seed default store configuration
        var configResult = StoreConfiguration.CreateDefault(notification.StoreId);
        if (configResult.IsFailure) return;

        await _configRepo.AddAsync(configResult.Value, cancellationToken);

        // Seed default page configurations
        await SeedDefaultPages(notification.StoreId, cancellationToken);
    }

    private async Task SeedDefaultPages(Domain.Common.Identifiers.StoreId storeId, CancellationToken ct)
    {
        // Home page with default sections
        var homePage = CreatePage(storeId, PageType.Home, "home",
            BilingualText.Create("الرئيسية", "Home"));
        if (homePage != null)
        {
            homePage.AddSection(SectionType.Hero, "hero-full-image", true, 0);
            homePage.AddSection(SectionType.FeaturedProducts, "grid-standard", true, 1);
            homePage.AddSection(SectionType.CategoryShowcase, "cats-grid", true, 2);
            homePage.AddSection(SectionType.FeatureHighlights, "feat-icons", true, 3);
            await _pageRepo.AddAsync(homePage, ct);
        }

        // Products page
        var productsPage = CreatePage(storeId, PageType.Products, "products",
            BilingualText.Create("المنتجات", "Products"));
        if (productsPage != null) await _pageRepo.AddAsync(productsPage, ct);

        // Product detail page
        var productDetailPage = CreatePage(storeId, PageType.ProductDetail, "product-detail",
            BilingualText.Create("تفاصيل المنتج", "Product Detail"));
        if (productDetailPage != null) await _pageRepo.AddAsync(productDetailPage, ct);

        // About page
        var aboutPage = CreatePage(storeId, PageType.About, "about",
            BilingualText.Create("من نحن", "About Us"));
        if (aboutPage != null) await _pageRepo.AddAsync(aboutPage, ct);

        // Contact page
        var contactPage = CreatePage(storeId, PageType.Contact, "contact",
            BilingualText.Create("اتصل بنا", "Contact Us"));
        if (contactPage != null) await _pageRepo.AddAsync(contactPage, ct);

        // FAQ page
        var faqPage = CreatePage(storeId, PageType.FAQ, "faq",
            BilingualText.Create("الأسئلة الشائعة", "FAQ"), false);
        if (faqPage != null) await _pageRepo.AddAsync(faqPage, ct);

        // Terms page
        var termsPage = CreatePage(storeId, PageType.Terms, "terms",
            BilingualText.Create("الشروط والأحكام", "Terms & Conditions"), false);
        if (termsPage != null) await _pageRepo.AddAsync(termsPage, ct);

        // Privacy page
        var privacyPage = CreatePage(storeId, PageType.Privacy, "privacy",
            BilingualText.Create("سياسة الخصوصية", "Privacy Policy"), false);
        if (privacyPage != null) await _pageRepo.AddAsync(privacyPage, ct);

        // Shipping & Returns page
        var shippingPage = CreatePage(storeId, PageType.ShippingReturns, "shipping-returns",
            BilingualText.Create("الشحن والإرجاع", "Shipping & Returns"), false);
        if (shippingPage != null) await _pageRepo.AddAsync(shippingPage, ct);

        // Cart page
        var cartPage = CreatePage(storeId, PageType.Cart, "cart",
            BilingualText.Create("سلة التسوق", "Cart"));
        if (cartPage != null) await _pageRepo.AddAsync(cartPage, ct);
    }

    private static PageConfiguration? CreatePage(
        Domain.Common.Identifiers.StoreId storeId,
        PageType pageType, string slug, BilingualText title, bool isEnabled = true)
    {
        var result = PageConfiguration.Create(storeId, pageType, slug, title, isEnabled);
        return result.IsSuccess ? result.Value : null;
    }
}
