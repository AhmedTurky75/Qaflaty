using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using PageConfigurationAggregate = Qaflaty.Domain.Catalog.Aggregates.PageConfiguration.PageConfiguration;

namespace Qaflaty.Application.Catalog.Commands.EnsureLayoutPage;

public class EnsureLayoutPageCommandHandler : ICommandHandler<EnsureLayoutPageCommand, PageConfigurationDto>
{
    private readonly IPageConfigurationRepository _pageConfigurationRepository;

    public EnsureLayoutPageCommandHandler(IPageConfigurationRepository pageConfigurationRepository)
    {
        _pageConfigurationRepository = pageConfigurationRepository;
    }

    public async Task<Result<PageConfigurationDto>> Handle(
        EnsureLayoutPageCommand request,
        CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<PageType>(request.LayoutType, true, out var pageType)
            || (pageType != PageType.Header && pageType != PageType.Footer))
        {
            return Result.Failure<PageConfigurationDto>(
                new Error("PageConfiguration.InvalidLayoutType", "A layout group is either Header or Footer."));
        }

        var storeId = new StoreId(request.StoreId);

        var existing = await _pageConfigurationRepository.GetByStoreIdAndTypeAsync(storeId, pageType, cancellationToken);
        if (existing != null)
            return Result.Success(MapToDto(existing));

        var title = pageType == PageType.Header
            ? BilingualText.Create("الترويسة", "Header")
            : BilingualText.Create("التذييل", "Footer");

        var pageResult = PageConfigurationAggregate.Create(
            storeId,
            pageType,
            pageType == PageType.Header ? "header" : "footer",
            title,
            isEnabled: true);

        if (pageResult.IsFailure)
            return Result.Failure<PageConfigurationDto>(pageResult.Error);

        await _pageConfigurationRepository.AddAsync(pageResult.Value, cancellationToken);
        return Result.Success(MapToDto(pageResult.Value));
    }

    private static PageConfigurationDto MapToDto(PageConfigurationAggregate page) => new(
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
