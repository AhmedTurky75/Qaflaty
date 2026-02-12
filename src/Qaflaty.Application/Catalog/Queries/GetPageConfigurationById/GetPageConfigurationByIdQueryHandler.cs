using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetPageConfigurationById;

public class GetPageConfigurationByIdQueryHandler : IQueryHandler<GetPageConfigurationByIdQuery, PageConfigurationDto>
{
    private readonly IPageConfigurationRepository _repository;

    public GetPageConfigurationByIdQueryHandler(IPageConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<PageConfigurationDto>> Handle(
        GetPageConfigurationByIdQuery query,
        CancellationToken cancellationToken)
    {
        var pageId = new PageConfigurationId(query.PageId);
        var page = await _repository.GetByIdAsync(pageId, cancellationToken);

        if (page is null)
        {
            return Result.Failure<PageConfigurationDto>(CatalogErrors.PageConfigurationNotFound);
        }

        var dto = MapToDto(page);

        return Result.Success(dto);
    }

    private static PageConfigurationDto MapToDto(Domain.Catalog.Aggregates.PageConfiguration.PageConfiguration page) => new(
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
