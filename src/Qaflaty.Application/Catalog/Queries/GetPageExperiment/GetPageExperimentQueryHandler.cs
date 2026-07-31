using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetPageExperiment;

/// <summary>
/// Returns the active A/B variants for a store page so the storefront can pick a
/// sticky variant client-side. The control (the page's own sections) is implied;
/// its weight is a fixed baseline of 1 for now.
/// </summary>
public class GetPageExperimentQueryHandler : IQueryHandler<GetPageExperimentQuery, PageExperimentDto>
{
    private const int ControlWeight = 1;

    private readonly IPageConfigurationRepository _repository;

    public GetPageExperimentQueryHandler(IPageConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<PageExperimentDto>> Handle(
        GetPageExperimentQuery query,
        CancellationToken cancellationToken)
    {
        var page = await _repository.GetByStoreIdAndSlugAsync(
            new StoreId(query.StoreId), query.Slug, cancellationToken);

        if (page == null)
            return Result.Failure<PageExperimentDto>(CatalogErrors.PageConfigurationNotFound);

        var variants = page.Variants
            .Where(v => v.IsActive && v.Weight > 0)
            .Select(v => new PageVariantDto(
                v.Id.Value, v.Name, v.Weight, v.IsActive, v.SectionsJson, v.Impressions, v.Conversions))
            .ToList();

        return Result.Success(new PageExperimentDto(page.Id.Value, ControlWeight, variants));
    }
}
