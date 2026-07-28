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

        var nameResult = CategoryName.Create(request.Name, request.NameAr);
        if (nameResult.IsFailure)
            return Result.Failure<CategoryDto>(nameResult.Error);

        var updateResult = category.UpdateInfo(nameResult.Value);
        if (updateResult.IsFailure)
            return Result.Failure<CategoryDto>(updateResult.Error);

        CategoryId? parentId = request.ParentId.HasValue ? new CategoryId(request.ParentId.Value) : null;
        var setParentResult = category.SetParent(parentId);
        if (setParentResult.IsFailure)
            return Result.Failure<CategoryDto>(setParentResult.Error);

        if (request.SortOrder.HasValue)
        {
            var sortResult = category.UpdateSortOrder(request.SortOrder.Value);
            if (sortResult.IsFailure)
                return Result.Failure<CategoryDto>(sortResult.Error);
        }

        var mediaResult = category.UpdateMedia(request.ImageUrl, request.IconName);
        if (mediaResult.IsFailure)
            return Result.Failure<CategoryDto>(mediaResult.Error);

        var contentResult = CategoryContent.Create(request.ContentHtml, request.ContentHtmlAr);
        if (contentResult.IsFailure)
            return Result.Failure<CategoryDto>(contentResult.Error);

        var updateContentResult = category.UpdateContent(contentResult.Value);
        if (updateContentResult.IsFailure)
            return Result.Failure<CategoryDto>(updateContentResult.Error);

        _categoryRepository.Update(category);

        var products = await _productRepository.GetByStoreIdAsync(category.StoreId, cancellationToken);
        var productCount = products.Count(p => p.CategoryId?.Value == category.Id.Value);

        var dto = new CategoryDto(
            category.Id.Value,
            category.Name.Value,
            category.Name.Arabic,
            category.Slug.Value,
            category.ParentId?.Value,
            category.SortOrder,
            productCount,
            category.ImageUrl,
            category.IconName,
            category.Content?.English,
            category.Content?.Arabic);

        return Result.Success(dto);
    }
}
