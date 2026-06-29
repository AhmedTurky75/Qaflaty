using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.Category;

public sealed class Category : AggregateRoot<CategoryId>
{
    public StoreId StoreId { get; private set; } // Store (tenant) the category belongs to
    public CategoryId? ParentId { get; private set; } // Parent category for nesting; null means a top-level category (supports a category tree)
    public CategoryName Name { get; private set; } = null!; // Display name of the category, e.g. "Men's Shoes"
    public CategorySlug Slug { get; private set; } = null!; // URL-friendly identifier for the category, e.g. "mens-shoes"
    public int SortOrder { get; private set; } // Manual ordering position among sibling categories (lower = first)
    public DateTime CreatedAt { get; private set; } // UTC timestamp when the category was created

    private Category() : base(CategoryId.Empty) { }

    public static Result<Category> Create(
        StoreId storeId,
        CategoryName name,
        CategorySlug slug,
        CategoryId? parentId = null,
        int sortOrder = 0)
    {
        var category = new Category
        {
            Id = CategoryId.New(),
            StoreId = storeId,
            Name = name,
            Slug = slug,
            ParentId = parentId,
            SortOrder = sortOrder,
            CreatedAt = DateTime.UtcNow
        };

        return Result.Success(category);
    }

    public Result UpdateInfo(CategoryName name)
    {
        Name = name;
        return Result.Success();
    }

    public Result SetParent(CategoryId? parentId)
    {
        if (parentId.HasValue && parentId.Value.Value == Id.Value)
            return Result.Failure(CatalogErrors.CannotBeOwnParent);

        ParentId = parentId;
        return Result.Success();
    }

    public Result UpdateSortOrder(int sortOrder)
    {
        SortOrder = sortOrder;
        return Result.Success();
    }
}
