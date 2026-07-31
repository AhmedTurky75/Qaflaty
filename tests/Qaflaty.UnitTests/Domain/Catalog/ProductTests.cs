using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Aggregates.Product.Events;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Identifiers;
using Xunit;
using static Qaflaty.UnitTests.Domain.Catalog.TestProductFactory;

namespace Qaflaty.UnitTests.Domain.Catalog;

public class ProductTests
{
    [Fact]
    public void Create_StartsAsDraft_AndRaisesCreatedEvent()
    {
        var product = NewProduct();

        Assert.Equal(ProductStatus.Draft, product.Status);
        Assert.False(product.HasVariants);
        Assert.Contains(product.DomainEvents, e => e is ProductCreatedEvent);
    }

    [Fact]
    public void Activate_And_Deactivate_ToggleStatus()
    {
        var product = NewProduct();

        product.Activate();
        Assert.Equal(ProductStatus.Active, product.Status);

        product.Deactivate();
        Assert.Equal(ProductStatus.Inactive, product.Status);
    }

    [Fact]
    public void UpdatePricing_WhenPriceChanges_RaisesPriceChangedEvent()
    {
        var product = NewProduct();
        product.ClearDomainEvents();

        product.UpdatePricing(Pricing(150m));

        Assert.Contains(product.DomainEvents, e => e is ProductPriceChangedEvent);
    }

    [Fact]
    public void UpdatePricing_WhenPriceUnchanged_DoesNotRaiseEvent()
    {
        var product = NewProduct();
        product.ClearDomainEvents();

        product.UpdatePricing(Pricing(100m)); // same price as factory default

        Assert.DoesNotContain(product.DomainEvents, e => e is ProductPriceChangedEvent);
    }

    [Fact]
    public void ReserveStock_ReducesInventory_AndRaisesStockChangedEvent()
    {
        var product = NewProduct(stock: 50);
        product.ClearDomainEvents();

        var result = product.ReserveStock(10);

        Assert.True(result.IsSuccess);
        Assert.Equal(40, product.Inventory.Quantity);
        Assert.Contains(product.DomainEvents, e => e is ProductStockChangedEvent);
    }

    [Fact]
    public void ReserveStock_MoreThanAvailable_Fails()
    {
        var product = NewProduct(stock: 5);

        var result = product.ReserveStock(10);

        Assert.True(result.IsFailure);
        Assert.Equal("Catalog.InsufficientStock", result.Error.Code);
        Assert.Equal(5, product.Inventory.Quantity); // unchanged
    }

    [Fact]
    public void RestoreStock_IncreasesInventory()
    {
        var product = NewProduct(stock: 10);

        var result = product.RestoreStock(15);

        Assert.True(result.IsSuccess);
        Assert.Equal(25, product.Inventory.Quantity);
    }

    // ---------- Variants ----------

    [Fact]
    public void AddVariantOption_Duplicate_Fails()
    {
        var product = NewProduct();
        product.AddVariantOption(VariantOption.Create("Color", ["Red"]).Value);

        var result = product.AddVariantOption(VariantOption.Create("color", ["Blue"]).Value);

        Assert.True(result.IsFailure);
        Assert.Equal("Product.VariantOptionExists", result.Error.Code);
    }

    [Fact]
    public void AddVariant_WithoutOptions_Fails()
    {
        var product = NewProduct();
        var variant = ProductVariant.Create(
            product.Id, new Dictionary<string, string> { ["Color"] = "Red" }, "SKU-1", null, 5, false).Value;

        var result = product.AddVariant(variant);

        Assert.True(result.IsFailure);
        Assert.Equal("Product.NoVariantOptions", result.Error.Code);
    }

    [Fact]
    public void AddVariant_Succeeds_AndMarksHasVariants()
    {
        var (product, _) = NewProductWithVariant();

        Assert.True(product.HasVariants);
        Assert.Single(product.Variants);
        Assert.Single(product.InventoryMovements); // initial movement recorded
    }

    [Fact]
    public void AddVariant_DuplicateSku_Fails()
    {
        var (product, _) = NewProductWithVariant();
        var dup = ProductVariant.Create(
            product.Id, new Dictionary<string, string> { ["Color"] = "Blue" }, "SKU-RED", null, 5, false).Value;

        var result = product.AddVariant(dup);

        Assert.True(result.IsFailure);
        Assert.Equal("Product.SkuExists", result.Error.Code);
    }

    [Fact]
    public void ReserveVariantStock_ReducesVariantQuantity_AndRecordsMovement()
    {
        var (product, variantId) = NewProductWithVariant(variantStock: 20);

        var result = product.ReserveVariantStock(variantId, 5);

        Assert.True(result.IsSuccess);
        Assert.Equal(15, product.GetVariant(variantId)!.Quantity);
        Assert.Equal(2, product.InventoryMovements.Count); // initial + sale
    }

    [Fact]
    public void ReserveVariantStock_LowStock_RaisesVariantStockLowEvent()
    {
        var (product, variantId) = NewProductWithVariant(variantStock: 12);
        product.ClearDomainEvents();

        product.ReserveVariantStock(variantId, 5); // 12 -> 7, below threshold of 10

        Assert.Contains(product.DomainEvents, e => e is VariantStockLowEvent);
    }

    [Fact]
    public void ReserveVariantStock_UnknownVariant_Fails()
    {
        var (product, _) = NewProductWithVariant();

        var result = product.ReserveVariantStock(Guid.NewGuid(), 1);

        Assert.True(result.IsFailure);
        Assert.Equal("Product.VariantNotFound", result.Error.Code);
    }
}
