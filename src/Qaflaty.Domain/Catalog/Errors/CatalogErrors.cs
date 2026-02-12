using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Domain.Catalog.Errors;

public static class CatalogErrors
{
    public static readonly Error SlugAlreadyExists =
        new("Catalog.SlugAlreadyExists", "This slug is already in use");

    public static readonly Error SlugReserved =
        new("Catalog.SlugReserved", "This slug is reserved and cannot be used");

    public static readonly Error StoreNotFound =
        new("Catalog.StoreNotFound", "Store not found");

    public static readonly Error ProductNotFound =
        new("Catalog.ProductNotFound", "Product not found");

    public static readonly Error CategoryNotFound =
        new("Catalog.CategoryNotFound", "Category not found");

    public static readonly Error InsufficientStock =
        new("Catalog.InsufficientStock", "Insufficient stock available");

    public static readonly Error InvalidPricing =
        new("Catalog.InvalidPricing", "Invalid pricing information");

    public static readonly Error InvalidSlugFormat =
        new("Catalog.InvalidSlugFormat", "Slug must be 3-50 characters, lowercase alphanumeric with hyphens");

    public static readonly Error InvalidHexColor =
        new("Catalog.InvalidHexColor", "Invalid hex color format");

    public static readonly Error InvalidThreshold =
        new("Catalog.InvalidThreshold", "Free delivery threshold must be greater than delivery fee");

    public static readonly Error CompareAtPriceTooLow =
        new("Catalog.CompareAtPriceTooLow", "Compare at price must be greater than price");

    public static readonly Error StockCannotBeNegative =
        new("Catalog.StockCannotBeNegative", "Stock quantity cannot be negative");

    public static readonly Error CategoryDepthExceeded =
        new("Catalog.CategoryDepthExceeded", "Category nesting cannot exceed 2 levels");

    public static readonly Error CannotBeOwnParent =
        new("Catalog.CannotBeOwnParent", "Category cannot be its own parent");

    public static readonly Error NameRequired =
        new("Catalog.NameRequired", "Name is required");

    public static readonly Error NameTooLong =
        new("Catalog.NameTooLong", "Name is too long");

    public static readonly Error StoreConfigurationNotFound =
        new("Catalog.StoreConfigurationNotFound", "Store configuration not found");

    public static readonly Error StoreConfigurationAlreadyExists =
        new("Catalog.StoreConfigurationAlreadyExists", "Store configuration already exists");

    public static readonly Error PageConfigurationNotFound =
        new("Catalog.PageConfigurationNotFound", "Page configuration not found");

    public static readonly Error CannotDeleteSystemPage =
        new("Catalog.CannotDeleteSystemPage", "Cannot delete a system page");

    public static readonly Error FaqItemNotFound =
        new("Catalog.FaqItemNotFound", "FAQ item not found");
}
