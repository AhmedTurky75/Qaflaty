using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Aggregates.PageConfiguration;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetPageVariants;

public class GetPageVariantsQueryHandler : IQueryHandler<GetPageVariantsQuery, List<PageVariantDto>>
{
    private readonly IPageConfigurationRepository _repository;

    public GetPageVariantsQueryHandler(IPageConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<List<PageVariantDto>>> Handle(
        GetPageVariantsQuery query,
        CancellationToken cancellationToken)
    {
        var page = await _repository.GetByIdAsync(new PageConfigurationId(query.PageId), cancellationToken);
        if (page == null)
            return Result.Failure<List<PageVariantDto>>(CatalogErrors.PageConfigurationNotFound);

        var dtos = page.Variants.Select(MapToDto).ToList();
        return Result.Success(dtos);
    }

    internal static PageVariantDto MapToDto(PageVariant v) => new(
        v.Id.Value,
        v.Name,
        v.Weight,
        v.IsActive,
        v.SectionsJson,
        v.Impressions,
        v.Conversions);
}
