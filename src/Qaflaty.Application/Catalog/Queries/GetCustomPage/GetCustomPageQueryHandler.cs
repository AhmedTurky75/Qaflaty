using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetCustomPage;

public class GetCustomPageQueryHandler : IQueryHandler<GetCustomPageQuery, PageConfigurationDto>
{
    private readonly IPageConfigurationRepository _pageRepo;

    public GetCustomPageQueryHandler(IPageConfigurationRepository pageRepo)
    {
        _pageRepo = pageRepo;
    }

    public async Task<Result<PageConfigurationDto>> Handle(GetCustomPageQuery request, CancellationToken cancellationToken)
    {
        var page = await _pageRepo.GetByStoreIdAndSlugAsync(
            StoreId.From(request.StoreId), request.Slug, cancellationToken);

        if (page == null || !page.IsEnabled)
            return Result.Failure<PageConfigurationDto>(CatalogErrors.PageConfigurationNotFound);

        var dto = new PageConfigurationDto(
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
                s.Id.Value, s.SectionType.ToString(), s.VariantId, s.IsEnabled,
                s.SortOrder, s.ContentJson, s.SettingsJson)).ToList(),
            page.CreatedAt,
            page.UpdatedAt);

        return Result.Success(dto);
    }
}
