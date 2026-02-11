using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetCategoryTree;

public class GetCategoryTreeQueryHandler : IQueryHandler<GetCategoryTreeQuery, List<CategoryTreeDto>>
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly IStoreRepository _storeRepository;

    public GetCategoryTreeQueryHandler(
        ICategoryRepository categoryRepository,
        IStoreRepository storeRepository)
    {
        _categoryRepository = categoryRepository;
        _storeRepository = storeRepository;
    }

    public async Task<Result<List<CategoryTreeDto>>> Handle(GetCategoryTreeQuery request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null)
            return Result.Failure<List<CategoryTreeDto>>(CatalogErrors.StoreNotFound);

        var categories = await _categoryRepository.GetByStoreIdAsync(storeId, cancellationToken);

        var lookup = categories
            .OrderBy(c => c.SortOrder)
            .ToLookup(c => c.ParentId?.Value);

        return Result.Success(BuildTree(lookup, null));
    }

    private static List<CategoryTreeDto> BuildTree(ILookup<Guid?, Domain.Catalog.Aggregates.Category.Category> lookup, Guid? parentId)
    {
        return lookup[parentId]
            .Select(c => new CategoryTreeDto(
                c.Id.Value,
                c.Name.Value,
                c.Slug.Value,
                BuildTree(lookup, c.Id.Value)
            )).ToList();
    }
}
