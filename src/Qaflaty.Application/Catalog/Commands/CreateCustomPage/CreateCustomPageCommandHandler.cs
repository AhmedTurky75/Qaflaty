using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Aggregates.PageConfiguration;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.CreateCustomPage;

public class CreateCustomPageCommandHandler : ICommandHandler<CreateCustomPageCommand, PageConfigurationDto>
{
    private readonly IPageConfigurationRepository _pageConfigurationRepository;

    public CreateCustomPageCommandHandler(IPageConfigurationRepository pageConfigurationRepository)
    {
        _pageConfigurationRepository = pageConfigurationRepository;
    }

    public async Task<Result<PageConfigurationDto>> Handle(
        CreateCustomPageCommand request,
        CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);
        var title = BilingualText.Create(request.Title.Arabic, request.Title.English);

        var pageResult = PageConfiguration.Create(
            storeId,
            PageType.Custom,
            request.Slug,
            title,
            isEnabled: true);

        if (pageResult.IsFailure)
            return Result.Failure<PageConfigurationDto>(pageResult.Error);

        var page = pageResult.Value;

        if (!string.IsNullOrEmpty(request.ContentJson))
        {
            page.UpdateInfo(title, request.Slug, request.ContentJson);
        }

        await _pageConfigurationRepository.AddAsync(page, cancellationToken);

        var dto = MapToDto(page);
        return Result.Success(dto);
    }

    private static PageConfigurationDto MapToDto(PageConfiguration page)
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
