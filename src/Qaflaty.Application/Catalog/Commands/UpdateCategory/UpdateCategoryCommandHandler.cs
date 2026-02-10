using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.UpdateCategory;

public class UpdateCategoryCommandHandler : ICommandHandler<UpdateCategoryCommand, CategoryDto>
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly IProductRepository _productRepository;

    public UpdateCategoryCommandHandler(
        ICategoryRepository categoryRepository,
        IProductRepository productRepository)
    {
        _categoryRepository = categoryRepository;
        _productRepository = productRepository;
    }

    public async Task<Result<CategoryDto>> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _categoryRepository.GetByIdAsync(new CategoryId(request.CategoryId), cancellationToken);
        if (category == null)
            return Result.Failure<CategoryDto>(new Error("Category.NotFound", "Category not found"));

        var nameResult = CategoryName.Create(request.Name);
        if (nameResult.IsFailure)
            return Result.Failure<CategoryDto>(nameResult.Error);

        var updateResult = category.UpdateInfo(nameResult.Value);
        if (updateResult.IsFailure)
            return Result.Failure<CategoryDto>(updateResult.Error);

        CategoryId? parentId = request.ParentId.HasValue ? new CategoryId(request.ParentId.Value) : null;
        var setParentResult = category.SetParent(parentId);
        if (setParentResult.IsFailure)
            return Result.Failure<CategoryDto>(setParentResult.Error);

        _categoryRepository.Update(category);

        var products = await _productRepository.GetByStoreIdAsync(category.StoreId, cancellationToken);
        var productCount = products.Count(p => p.CategoryId?.Value == category.Id.Value);

        var dto = new CategoryDto(
            category.Id.Value,
            category.Name.Value,
            category.Slug.Value,
            category.ParentId?.Value,
            category.SortOrder,
            productCount);

        return Result.Success(dto);
    }
}
