using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetStorefrontProductLandingPage;

public class GetStorefrontProductLandingPageQueryHandler
    : IQueryHandler<GetStorefrontProductLandingPageQuery, PageConfigurationDto>
{
    private readonly IProductRepository _productRepository;
    private readonly IPageConfigurationRepository _pageConfigurationRepository;

    public GetStorefrontProductLandingPageQueryHandler(
        IProductRepository productRepository,
        IPageConfigurationRepository pageConfigurationRepository)
    {
        _productRepository = productRepository;
        _pageConfigurationRepository = pageConfigurationRepository;
    }

    public async Task<Result<PageConfigurationDto>> Handle(
        GetStorefrontProductLandingPageQuery request,
        CancellationToken cancellationToken)
    {
        var slugResult = ProductSlug.Create(request.Slug);
        if (slugResult.IsFailure)
            return Result.Failure<PageConfigurationDto>(CatalogErrors.LandingPageNotFound);

        var storeId = new StoreId(request.StoreId);
        var product = await _productRepository.GetBySlugAsync(storeId, slugResult.Value, cancellationToken);
        if (product == null || product.Status != ProductStatus.Active)
            return Result.Failure<PageConfigurationDto>(CatalogErrors.LandingPageNotFound);

        var page = await _pageConfigurationRepository.GetByProductIdAsync(product.Id, cancellationToken);
        if (page is null || page.PageType != PageType.ProductLanding || !page.IsEnabled)
            return Result.Failure<PageConfigurationDto>(CatalogErrors.LandingPageNotFound);

        return Result.Success(MapToDto(page));
    }

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
            page.Sections.Where(s => s.IsEnabled).OrderBy(s => s.SortOrder).Select(s => new SectionConfigurationDto(
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
