using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Queries.GetLayoutVariants;

public class GetLayoutVariantsQueryHandler : IQueryHandler<GetLayoutVariantsQuery, List<LayoutVariantDto>>
{
    private readonly ILayoutVariantRepository _layoutVariantRepository;

    public GetLayoutVariantsQueryHandler(ILayoutVariantRepository layoutVariantRepository)
    {
        _layoutVariantRepository = layoutVariantRepository;
    }

    public async Task<Result<List<LayoutVariantDto>>> Handle(GetLayoutVariantsQuery request, CancellationToken cancellationToken)
    {
        var variants = await _layoutVariantRepository.GetAllActiveAsync(cancellationToken);

        return Result.Success(variants.Select(v => new LayoutVariantDto(
            v.Id.Value,
            v.Type.ToString(),
            v.Code,
            v.NameEn,
            v.NameAr,
            v.SortOrder
        )).ToList());
    }
}
