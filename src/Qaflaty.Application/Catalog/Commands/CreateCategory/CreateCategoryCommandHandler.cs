using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Catalog.Aggregates.Category;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.CreateCategory;

public class CreateCategoryCommandHandler : ICommandHandler<CreateCategoryCommand, CategoryDto>
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public CreateCategoryCommandHandler(
        ICategoryRepository categoryRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _categoryRepository = categoryRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<CategoryDto>> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        // Verify store ownership
        var storeId = new StoreId(request.StoreId);
        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null ||
            !await _storeRepository.CanMerchantAccessStoreAsync(
                _currentUserService.MerchantId ?? default, store.Id, cancellationToken))
            return Result.Failure<CategoryDto>(new Error("Category.Unauthorized", "You don't have access to this store"));

        // Create category name
        var nameResult = CategoryName.Create(request.Name, request.NameAr);
        if (nameResult.IsFailure)
            return Result.Failure<CategoryDto>(nameResult.Error);

        // Create slug
        var slugResult = CategorySlug.Create(request.Slug);
        if (slugResult.IsFailure)
            return Result.Failure<CategoryDto>(slugResult.Error);

        // Check slug availability
        var isSlugAvailable = await _categoryRepository.IsSlugAvailableAsync(storeId, slugResult.Value, null, cancellationToken);
        if (!isSlugAvailable)
            return Result.Failure<CategoryDto>(new Error("Category.SlugTaken", "This slug is already taken"));

        CategoryId? parentId = request.ParentId.HasValue ? new CategoryId(request.ParentId.Value) : null;

        // Optional storefront HTML block shown above this category's products
        var contentResult = CategoryContent.Create(request.ContentHtml, request.ContentHtmlAr);
        if (contentResult.IsFailure)
            return Result.Failure<CategoryDto>(contentResult.Error);

        // Create category
        var categoryResult = Category.Create(
            storeId,
            nameResult.Value,
            slugResult.Value,
            parentId,
            request.SortOrder,
            contentResult.Value,
            request.ImageUrl,
            request.IconName);

        if (categoryResult.IsFailure)
            return Result.Failure<CategoryDto>(categoryResult.Error);

        var category = categoryResult.Value;

        await _categoryRepository.AddAsync(category, cancellationToken);

        var dto = new CategoryDto(
            category.Id.Value,
            category.Name.Value,
            category.Name.Arabic,
            category.Slug.Value,
            category.ParentId?.Value,
            category.SortOrder,
            0, // Product count will be calculated by query
            category.ImageUrl,
            category.IconName,
            category.Content?.English,
            category.Content?.Arabic);

        return Result.Success(dto);
    }
}
