using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Exceptions;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetCategories;

public class GetCategoriesQueryHandler : IQueryHandler<GetCategoriesQuery, List<CategoryDto>>
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly IProductRepository _productRepository;

    public GetCategoriesQueryHandler(
        ICategoryRepository categoryRepository,
        IStoreRepository storeRepository,
        IProductRepository productRepository)
    {
        _categoryRepository = categoryRepository;
        _storeRepository = storeRepository;
        _productRepository = productRepository;
    }

    public async Task<List<CategoryDto>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null)
            throw new NotFoundException("Store", request.StoreId);

        var categories = await _categoryRepository.GetByStoreIdAsync(storeId, cancellationToken);
        var products = await _productRepository.GetByStoreIdAsync(storeId, cancellationToken);

        return categories
            .OrderBy(c => c.SortOrder)
            .Select(c => new CategoryDto(
                c.Id.Value,
                c.Name.Value,
                c.Slug.Value,
                c.ParentId?.Value,
                c.SortOrder,
                products.Count(p => p.CategoryId?.Value == c.Id.Value)
            )).ToList();
    }
}
