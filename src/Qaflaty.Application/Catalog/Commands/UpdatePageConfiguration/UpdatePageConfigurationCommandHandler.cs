using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.UpdatePageConfiguration;

public class UpdatePageConfigurationCommandHandler : ICommandHandler<UpdatePageConfigurationCommand, PageConfigurationDto>
{
    private readonly IPageConfigurationRepository _pageConfigurationRepository;

    public UpdatePageConfigurationCommandHandler(IPageConfigurationRepository pageConfigurationRepository)
    {
        _pageConfigurationRepository = pageConfigurationRepository;
    }

    public async Task<Result<PageConfigurationDto>> Handle(
        UpdatePageConfigurationCommand request,
        CancellationToken cancellationToken)
    {
        var pageId = new PageConfigurationId(request.PageId);
        var page = await _pageConfigurationRepository.GetByIdAsync(pageId, cancellationToken);

        if (page == null)
            return Result.Failure<PageConfigurationDto>(CatalogErrors.PageConfigurationNotFound);

        // Update basic info
        var title = BilingualText.Create(request.Title.Arabic, request.Title.English);
        page.UpdateInfo(title, request.Slug, request.ContentJson);

        // Update SEO settings
        var metaTitle = BilingualText.Create(
            request.SeoSettings.MetaTitle.Arabic,
            request.SeoSettings.MetaTitle.English);
        var metaDescription = BilingualText.Create(
            request.SeoSettings.MetaDescription.Arabic,
            request.SeoSettings.MetaDescription.English);

        var seoSettings = PageSeoSettings.Create(
            metaTitle,
            metaDescription,
            request.SeoSettings.OgImageUrl,
            request.SeoSettings.NoIndex,
            request.SeoSettings.NoFollow);
        page.UpdateSeoSettings(seoSettings);

        // Enable or disable
        if (request.IsEnabled)
            page.Enable();
        else
            page.Disable();

        _pageConfigurationRepository.Update(page);

        var dto = MapToDto(page);
        return Result.Success(dto);
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
