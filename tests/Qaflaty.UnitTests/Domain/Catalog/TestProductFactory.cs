using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.UnitTests.Domain.Catalog;

internal static class TestProductFactory
{
    public static Money M(decimal amount) => Money.Create(amount).Value;

    public static ProductPricing Pricing(decimal price = 100m) =>
        ProductPricing.Create(M(price)).Value;

    public static ProductInventory Inventory(int qty = 50, bool track = true) =>
        ProductInventory.Create(qty, trackInventory: track).Value;

    public static Product NewProduct(int stock = 50)
    {
        return Product.Create(
            StoreId.New(),
            ProductName.Create("Test Product").Value,
            ProductSlug.Create("test-product").Value,
            Pricing(),
            Inventory(stock)).Value;
    }

    /// <summary>Creates a product with one variant option ("Color") and one variant ("Red").</summary>
    public static (Product product, Guid variantId) NewProductWithVariant(int variantStock = 20)
    {
        var product = NewProduct();
        product.AddVariantOption(VariantOption.Create("Color", ["Red", "Blue"]).Value);
        var variant = ProductVariant.Create(
            product.Id,
            new Dictionary<string, string> { ["Color"] = "Red" },
            "SKU-RED",
            null,
            variantStock,
            allowBackorder: false).Value;
        product.AddVariant(variant);
        return (product, variant.Id);
    }
}
