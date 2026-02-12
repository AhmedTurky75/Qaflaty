using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetPageConfigurations;

public class GetPageConfigurationsQueryHandler : IQueryHandler<GetPageConfigurationsQuery, List<PageConfigurationDto>>
{
    private readonly IPageConfigurationRepository _repository;

    public GetPageConfigurationsQueryHandler(IPageConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<List<PageConfigurationDto>>> Handle(
        GetPageConfigurationsQuery query,
        CancellationToken cancellationToken)
    {
        var storeId = new StoreId(query.StoreId);
        var pages = await _repository.GetByStoreIdAsync(storeId, cancellationToken);

        var dtos = pages.Select(MapToDto).ToList();

        return Result.Success(dtos);
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
