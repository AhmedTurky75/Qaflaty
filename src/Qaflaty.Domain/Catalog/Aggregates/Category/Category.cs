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
    public CategoryContent? Content { get; private set; } // Bilingual HTML rendered above the products on the category page; null when the merchant authored none
    public string? ImageUrl { get; private set; } // Uploaded category image (banner/thumbnail); takes precedence over IconName when both are set
    public string? IconName { get; private set; } // Built-in glyph key used when no image is uploaded, e.g. "shirt"
    public DateTime CreatedAt { get; private set; } // UTC timestamp when the category was created

    public const int MaxImageUrlLength = 500;
    public const int MaxIconNameLength = 50;

    private Category() : base(CategoryId.Empty) { }

    public static Result<Category> Create(
        StoreId storeId,
        CategoryName name,
        CategorySlug slug,
        CategoryId? parentId = null,
        int sortOrder = 0,
        CategoryContent? content = null,
        string? imageUrl = null,
        string? iconName = null)
    {
        var category = new Category
        {
            Id = CategoryId.New(),
            StoreId = storeId,
            Name = name,
            Slug = slug,
            ParentId = parentId,
            SortOrder = sortOrder,
            Content = content,
            CreatedAt = DateTime.UtcNow
        };

        var mediaResult = category.UpdateMedia(imageUrl, iconName);
        if (mediaResult.IsFailure)
            return Result.Failure<Category>(mediaResult.Error);

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

    /// <summary>Replaces the storefront HTML block. Pass <c>null</c> to clear it.</summary>
    public Result UpdateContent(CategoryContent? content)
    {
        Content = content;
        return Result.Success();
    }

    /// <summary>
    /// Sets the category's visual: an uploaded image and/or a built-in icon key. Blank values clear
    /// the corresponding field, so a merchant can swap an image for an icon and back.
    /// </summary>
    public Result UpdateMedia(string? imageUrl, string? iconName)
    {
        var url = string.IsNullOrWhiteSpace(imageUrl) ? null : imageUrl.Trim();
        var icon = string.IsNullOrWhiteSpace(iconName) ? null : iconName.Trim();

        if (url is { Length: > MaxImageUrlLength })
            return Result.Failure(CatalogErrors.CategoryImageUrlTooLong);

        if (icon is { Length: > MaxIconNameLength })
            return Result.Failure(CatalogErrors.CategoryIconNameTooLong);

        ImageUrl = url;
        IconName = icon;
        return Result.Success();
    }
}
