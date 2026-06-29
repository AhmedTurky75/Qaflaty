using Qaflaty.Domain.Catalog.Aggregates.Product.Events;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.Domain.Catalog.Aggregates.Product;

public sealed class Product : AggregateRoot<ProductId>
{
    public StoreId StoreId { get; private set; } // Owning store (tenant) this product belongs to; every product is scoped to exactly one store
    public CategoryId? CategoryId { get; private set; } // Optional category the product is filed under; null means uncategorized
    public ProductName Name { get; private set; } = null!; // Display name of the product, e.g. "T-Shirt", "iPhone 15"
    public ProductSlug Slug { get; private set; } = null!; // URL-friendly unique identifier used in storefront links, e.g. "blue-cotton-tshirt"
    public string? Description { get; private set; } // Long-form product description / details shown on the product page; optional
    public ProductPricing Pricing { get; private set; } = null!; // Price value object holding base price, optional compare-at (sale) price, and currency
    public ProductInventory Inventory { get; private set; } = null!; // Stock value object: on-hand quantity, reserved quantity, backorder policy (for non-variant products)
    public ProductStatus Status { get; private set; } // Lifecycle state: Draft / Active / Inactive — controls storefront visibility
    public DateTime CreatedAt { get; private set; } // UTC timestamp when the product was first created
    public DateTime UpdatedAt { get; private set; } // UTC timestamp of the last modification to the product

    private readonly List<ProductImage> _images = []; // Backing collection of product images (gallery)
    public IReadOnlyList<ProductImage> Images => _images.AsReadOnly(); // Read-only product image gallery with sort order, e.g. main photo + thumbnails

    // Variant Support
    private readonly List<VariantOption> _variantOptions = []; // Backing list of variant dimensions
    public IReadOnlyList<VariantOption> VariantOptions => _variantOptions.AsReadOnly(); // Variant dimensions/axes the product varies along, e.g. "Color": [Red, Blue], "Size": [S, M, L]

    private readonly List<ProductVariant> _variants = []; // Backing list of concrete sellable variants
    public IReadOnlyList<ProductVariant> Variants => _variants.AsReadOnly(); // Concrete purchasable combinations, each with its own SKU/stock/price, e.g. "Red / Large"

    private readonly List<InventoryMovement> _inventoryMovements = []; // Backing list of stock ledger entries
    public IReadOnlyList<InventoryMovement> InventoryMovements => _inventoryMovements.AsReadOnly(); // Audit trail of every stock change (sale, restock, adjustment), e.g. "-1 on sale", "+50 restock"

    private readonly List<ProductPropertyValue> _propertyValues = []; // Backing list of custom property values
    public IReadOnlyList<ProductPropertyValue> PropertyValues => _propertyValues.AsReadOnly(); // Custom attribute values assigned to this product, e.g. "Material": "Cotton", "Brand": "Nike"

    public bool HasVariants => _variantOptions.Count > 0; // True when the product is sold in multiple variants (has at least one variant option defined)

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

    public Result SetImages(List<ProductImage> images)
    {
        _images.Clear();
        _images.AddRange(images);
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

    // Variant Management
    public Result AddVariantOption(VariantOption option)
    {
        // Check if option with same name already exists
        if (_variantOptions.Any(vo => vo.Name.Equals(option.Name, StringComparison.OrdinalIgnoreCase)))
            return Result.Failure(new Error("Product.VariantOptionExists",
                $"Variant option '{option.Name}' already exists"));

        _variantOptions.Add(option);
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result AddVariant(ProductVariant variant)
    {
        if (!HasVariants)
            return Result.Failure(new Error("Product.NoVariantOptions",
                "Cannot add variant. Product has no variant options defined"));

        // Check if variant with same attributes already exists
        var existingVariant = _variants.FirstOrDefault(v =>
            v.Attributes.Count == variant.Attributes.Count &&
            v.Attributes.All(kvp => variant.Attributes.TryGetValue(kvp.Key, out var value) &&
                value.Equals(kvp.Value, StringComparison.OrdinalIgnoreCase)));

        if (existingVariant != null)
            return Result.Failure(new Error("Product.VariantExists",
                "A variant with these attributes already exists"));

        // Check if SKU already exists
        if (_variants.Any(v => v.Sku.Equals(variant.Sku, StringComparison.OrdinalIgnoreCase)))
            return Result.Failure(new Error("Product.SkuExists",
                $"SKU '{variant.Sku}' already exists for another variant"));

        _variants.Add(variant);

        // Record initial inventory movement
        var movement = InventoryMovement.Create(
            Id,
            variant.Id,
            variant.Quantity,
            variant.Quantity,
            InventoryMovementType.Initial,
            "Initial variant stock");

        _inventoryMovements.Add(movement);

        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result UpdateVariant(Guid variantId, string sku, Money? priceOverride, bool allowBackorder)
    {
        var variant = _variants.FirstOrDefault(v => v.Id == variantId);
        if (variant == null)
            return Result.Failure(new Error("Product.VariantNotFound", "Variant not found"));

        // Check if new SKU conflicts with other variants
        if (_variants.Any(v => v.Id != variantId && v.Sku.Equals(sku, StringComparison.OrdinalIgnoreCase)))
            return Result.Failure(new Error("Product.SkuExists",
                $"SKU '{sku}' already exists for another variant"));

        var result = variant.UpdateInfo(sku, priceOverride, allowBackorder);
        if (result.IsFailure)
            return result;

        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result ReserveVariantStock(Guid variantId, int quantity)
    {
        var variant = _variants.FirstOrDefault(v => v.Id == variantId);
        if (variant == null)
            return Result.Failure(new Error("Product.VariantNotFound", "Variant not found"));

        var oldQuantity = variant.Quantity;
        var result = variant.ReserveStock(quantity);
        if (result.IsFailure)
            return result;

        // Record inventory movement
        var movement = InventoryMovement.Create(
            Id,
            variantId,
            -quantity,
            variant.Quantity,
            InventoryMovementType.Sale,
            "Stock reserved for order");

        _inventoryMovements.Add(movement);

        // Check if stock is low (less than 10 units)
        if (variant.Quantity < 10 && !variant.AllowBackorder)
            RaiseDomainEvent(new VariantStockLowEvent(Id, variantId, variant.Sku, variant.Quantity, 10));

        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result AdjustVariantInventory(Guid variantId, int quantityChange, InventoryMovementType type, string reason)
    {
        var variant = _variants.FirstOrDefault(v => v.Id == variantId);
        if (variant == null)
            return Result.Failure(new Error("Product.VariantNotFound", "Variant not found"));

        var result = variant.AdjustStock(quantityChange, reason);
        if (result.IsFailure)
            return result;

        // Record inventory movement
        var movement = InventoryMovement.Create(
            Id,
            variantId,
            quantityChange,
            variant.Quantity,
            type,
            reason);

        _inventoryMovements.Add(movement);

        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public ProductVariant? GetVariant(Guid variantId)
    {
        return _variants.FirstOrDefault(v => v.Id == variantId);
    }

    /// <summary>Replaces all property values with the provided set.</summary>
    public Result SetPropertyValues(IEnumerable<ProductPropertyValue> values)
    {
        _propertyValues.Clear();
        _propertyValues.AddRange(values);
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }
}
