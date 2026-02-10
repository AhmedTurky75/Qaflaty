using Qaflaty.Domain.Catalog.Aggregates.Product.Events;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.Product;

public sealed class Product : AggregateRoot<ProductId>
{
    public StoreId StoreId { get; private set; }
    public CategoryId? CategoryId { get; private set; }
    public ProductName Name { get; private set; } = null!;
    public ProductSlug Slug { get; private set; } = null!;
    public string? Description { get; private set; }
    public ProductPricing Pricing { get; private set; } = null!;
    public ProductInventory Inventory { get; private set; } = null!;
    public ProductStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private readonly List<ProductImage> _images = [];
    public IReadOnlyList<ProductImage> Images => _images.AsReadOnly();

    private Product() : base(ProductId.Empty) { }

    public static Result<Product> Create(
        StoreId storeId,
        ProductName name,
        ProductSlug slug,
        ProductPricing pricing,
        ProductInventory inventory)
    {
        var product = new Product
        {
            Id = ProductId.New(),
            StoreId = storeId,
            Name = name,
            Slug = slug,
            Pricing = pricing,
            Inventory = inventory,
            Status = ProductStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        product.RaiseDomainEvent(new ProductCreatedEvent(product.Id, storeId));

        return Result.Success(product);
    }

    public Result UpdateInfo(ProductName name, ProductSlug slug, string? description, CategoryId? categoryId)
    {
        Name = name;
        Slug = slug;
        Description = description;
        CategoryId = categoryId;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result UpdatePricing(ProductPricing newPricing)
    {
        var oldPrice = Pricing.Price;
        Pricing = newPricing;
        UpdatedAt = DateTime.UtcNow;

        if (oldPrice.Amount != newPricing.Price.Amount)
            RaiseDomainEvent(new ProductPriceChangedEvent(Id, oldPrice, newPricing.Price));

        return Result.Success();
    }

    public Result UpdateInventory(ProductInventory newInventory)
    {
        var oldQuantity = Inventory.Quantity;
        Inventory = newInventory;
        UpdatedAt = DateTime.UtcNow;

        if (oldQuantity != newInventory.Quantity)
            RaiseDomainEvent(new ProductStockChangedEvent(Id, oldQuantity, newInventory.Quantity));

        return Result.Success();
    }

    public Result AddImage(ProductImage image)
    {
        _images.Add(image);
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result RemoveImage(Guid imageId)
    {
        var image = _images.FirstOrDefault(i => i.Id == imageId);
        if (image == null)
            return Result.Failure(CatalogErrors.ProductNotFound);

        _images.Remove(image);
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result ReorderImages(List<Guid> imageIds)
    {
        for (int i = 0; i < imageIds.Count; i++)
        {
            var image = _images.FirstOrDefault(img => img.Id == imageIds[i]);
            image?.UpdateSortOrder(i);
        }

        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result Activate()
    {
        Status = ProductStatus.Active;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result Deactivate()
    {
        Status = ProductStatus.Inactive;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result ReserveStock(int quantity)
    {
        var result = Inventory.Reserve(quantity);
        if (result.IsSuccess)
        {
            UpdatedAt = DateTime.UtcNow;
            RaiseDomainEvent(new ProductStockChangedEvent(Id, Inventory.Quantity + quantity, Inventory.Quantity));
        }
        return result;
    }

    public Result RestoreStock(int quantity)
    {
        var oldQuantity = Inventory.Quantity;
        var result = Inventory.Restock(quantity);
        if (result.IsSuccess)
        {
            UpdatedAt = DateTime.UtcNow;
            RaiseDomainEvent(new ProductStockChangedEvent(Id, oldQuantity, Inventory.Quantity));
        }
        return result;
    }
}
