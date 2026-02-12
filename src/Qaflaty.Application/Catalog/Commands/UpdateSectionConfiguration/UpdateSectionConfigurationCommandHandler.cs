using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.UpdateSectionConfiguration;

public class UpdateSectionConfigurationCommandHandler : ICommandHandler<UpdateSectionConfigurationCommand, PageConfigurationDto>
{
    private readonly IPageConfigurationRepository _pageConfigurationRepository;

    public UpdateSectionConfigurationCommandHandler(IPageConfigurationRepository pageConfigurationRepository)
    {
        _pageConfigurationRepository = pageConfigurationRepository;
    }

    public async Task<Result<PageConfigurationDto>> Handle(
        UpdateSectionConfigurationCommand request,
        CancellationToken cancellationToken)
    {
        var pageId = new PageConfigurationId(request.PageId);
        var page = await _pageConfigurationRepository.GetByIdAsync(pageId, cancellationToken);

        if (page == null)
            return Result.Failure<PageConfigurationDto>(CatalogErrors.PageConfigurationNotFound);

        // Clear existing sections
        page.ClearSections();

        // Add new sections
        foreach (var sectionDto in request.Sections.OrderBy(s => s.SortOrder))
        {
            if (!Enum.TryParse<SectionType>(sectionDto.SectionType, true, out var sectionType))
                return Result.Failure<PageConfigurationDto>(
                    new Error("PageConfiguration.InvalidSectionType", $"Invalid section type: {sectionDto.SectionType}"));

            page.AddSection(
                sectionType,
                sectionDto.VariantId,
                sectionDto.IsEnabled,
                sectionDto.SortOrder,
                sectionDto.ContentJson,
                sectionDto.SettingsJson);
        }

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
