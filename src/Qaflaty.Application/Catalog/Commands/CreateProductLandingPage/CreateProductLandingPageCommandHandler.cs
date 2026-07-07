using System.Text.Json;
using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.CreateProductLandingPage;

public class CreateProductLandingPageCommandHandler : ICommandHandler<CreateProductLandingPageCommand, PageConfigurationDto>
{
    private readonly IPageConfigurationRepository _pageConfigurationRepository;
    private readonly IProductRepository _productRepository;

    public CreateProductLandingPageCommandHandler(
        IPageConfigurationRepository pageConfigurationRepository,
        IProductRepository productRepository)
    {
        _pageConfigurationRepository = pageConfigurationRepository;
        _productRepository = productRepository;
    }

    public async Task<Result<PageConfigurationDto>> Handle(
        CreateProductLandingPageCommand request,
        CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);
        var productId = new ProductId(request.ProductId);

        var product = await _productRepository.GetByIdAsync(productId, cancellationToken);
        if (product == null || product.StoreId != storeId)
            return Result.Failure<PageConfigurationDto>(CatalogErrors.ProductNotFound);

        var existing = await _pageConfigurationRepository.GetByProductIdAsync(productId, cancellationToken);
        if (existing != null)
            return Result.Failure<PageConfigurationDto>(CatalogErrors.LandingPageAlreadyExists);

        var title = BilingualText.Create(product.Name.Arabic, product.Name.English);
        var slug = $"product-landing-{productId.Value:N}";

        var pageResult = Domain.Catalog.Aggregates.PageConfiguration.PageConfiguration.CreateForProduct(
            storeId, productId, title, slug);

        if (pageResult.IsFailure)
            return Result.Failure<PageConfigurationDto>(pageResult.Error);

        var page = pageResult.Value;
        SeedDefaultSections(page, product.Name.English);

        await _pageConfigurationRepository.AddAsync(page, cancellationToken);

        return Result.Success(MapToDto(page));
    }

    private static void SeedDefaultSections(
        Domain.Catalog.Aggregates.PageConfiguration.PageConfiguration page, string productName)
    {
        var bilingual = (string en) => new { en, ar = "" };

        page.AddSection(SectionType.MediaText, "media-text-standard", true, 1, Json(new
        {
            items = new[]
            {
                new
                {
                    imageUrl = "",
                    title = bilingual("Designed Around You"),
                    text = bilingual($"{productName} is built to fit seamlessly into your everyday routine — thoughtful details, premium materials, and a finish that lasts."),
                    reverse = false
                },
                new
                {
                    imageUrl = "",
                    title = bilingual("Built to Last"),
                    text = bilingual($"Every {productName} goes through strict quality checks before it reaches you, so you can trust it for years to come."),
                    reverse = true
                }
            }
        }));

        page.AddSection(SectionType.Benefits, "benefits-standard", true, 2, Json(new
        {
            title = bilingual("Why You'll Love It"),
            items = new[]
            {
                new { icon = "⭐", title = bilingual("Premium Quality"), text = bilingual("Carefully sourced materials and strict quality control on every unit.") },
                new { icon = "🚚", title = bilingual("Fast Delivery"), text = bilingual("Quick processing and reliable shipping, with tracking every step of the way.") },
                new { icon = "↩️", title = bilingual("Easy Returns"), text = bilingual("Not the right fit? Return it within 14 days, hassle-free.") }
            }
        }));

        page.AddSection(SectionType.ReviewsShowcase, "reviews-standard", true, 3, Json(new
        {
            title = bilingual("What Customers Say")
        }));

        page.AddSection(SectionType.Faq, "faq-accordion", true, 4, Json(new
        {
            title = bilingual("Frequently Asked Questions"),
            items = new[]
            {
                new { question = bilingual($"What's included with my {productName}?"), answer = bilingual($"Your order includes the {productName} exactly as shown, carefully packaged and ready to use.") },
                new { question = bilingual("How long does shipping take?"), answer = bilingual("Orders are processed within 1–2 business days. Delivery time varies by location; you'll see an estimate at checkout.") },
                new { question = bilingual("What is your return policy?"), answer = bilingual("You can return eligible items within 14 days of delivery in their original condition for a refund or exchange.") },
                new { question = bilingual("Is this covered by a warranty?"), answer = bilingual("Yes, this product is covered against manufacturing defects. Contact our support team for warranty claims.") }
            }
        }));

        page.AddSection(SectionType.Guarantee, "guarantee-standard", true, 5, Json(new
        {
            icon = "🛡️",
            title = bilingual("Satisfaction Guaranteed"),
            text = bilingual("Not happy with your purchase? Return it within 14 days for a full refund, no questions asked.")
        }));

        page.AddSection(SectionType.CallToAction, "cta-band", true, 6, Json(new
        {
            title = bilingual("Ready to get yours?"),
            subtitle = bilingual($"{productName} is waiting for you."),
            buttonText = bilingual("Shop Now")
        }));
    }

    private static string Json(object content) => JsonSerializer.Serialize(content);

    private static PageConfigurationDto MapToDto(Domain.Catalog.Aggregates.PageConfiguration.PageConfiguration page)
    {
        return new PageConfigurationDto(
            page.Id.Value,
            page.StoreId.Value,
            page.PageType.ToString(),
            page.Slug,
            new BilingualTextDto(page.Title.Arabic, page.Title.English),
            page.IsEnabled,
            new PageSeoSettingsDto(
                new BilingualTextDto(page.SeoSettings.MetaTitle.Arabic, page.SeoSettings.MetaTitle.English),
                new BilingualTextDto(page.SeoSettings.MetaDescription.Arabic, page.SeoSettings.MetaDescription.English),
                page.SeoSettings.OgImageUrl,
                page.SeoSettings.NoIndex,
                page.SeoSettings.NoFollow),
            page.ContentJson,
            page.Sections.OrderBy(s => s.SortOrder).Select(s => new SectionConfigurationDto(
                s.Id.Value,
                s.SectionType.ToString(),
                s.VariantId,
                s.IsEnabled,
                s.SortOrder,
                s.ContentJson,
                s.SettingsJson)).ToList(),
            page.CreatedAt,
            page.UpdatedAt);
    }
}
