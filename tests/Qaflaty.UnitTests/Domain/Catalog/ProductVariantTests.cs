using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Common.Identifiers;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Catalog;

public class ProductVariantTests
{
    private static ProductVariant Variant(int qty = 10, bool backorder = false) =>
        ProductVariant.Create(
            ProductId.New(),
            new Dictionary<string, string> { ["Color"] = "Red", ["Size"] = "M" },
            "SKU-RED-M",
            null,
            qty,
            backorder).Value;

    [Fact]
    public void Create_NoAttributes_Fails()
    {
        var result = ProductVariant.Create(
            ProductId.New(), new Dictionary<string, string>(), "SKU", null, 1, false);

        Assert.True(result.IsFailure);
        Assert.Equal("ProductVariant.AttributesRequired", result.Error.Code);
    }

    [Fact]
    public void Create_BlankSku_Fails()
    {
        var result = ProductVariant.Create(
            ProductId.New(), new Dictionary<string, string> { ["Color"] = "Red" }, "  ", null, 1, false);

        Assert.True(result.IsFailure);
        Assert.Equal("ProductVariant.SkuRequired", result.Error.Code);
    }

    [Fact]
    public void Create_NegativeQuantity_Fails()
    {
        var result = ProductVariant.Create(
            ProductId.New(), new Dictionary<string, string> { ["Color"] = "Red" }, "SKU", null, -1, false);

        Assert.True(result.IsFailure);
        Assert.Equal("ProductVariant.InvalidQuantity", result.Error.Code);
    }

    [Fact]
    public void ReserveStock_Sufficient_Decrements()
    {
        var variant = Variant(qty: 10);

        var result = variant.ReserveStock(4);

        Assert.True(result.IsSuccess);
        Assert.Equal(6, variant.Quantity);
    }

    [Fact]
    public void ReserveStock_InsufficientWithoutBackorder_Fails()
    {
        var variant = Variant(qty: 3, backorder: false);

        var result = variant.ReserveStock(5);

        Assert.True(result.IsFailure);
        Assert.Equal("ProductVariant.InsufficientStock", result.Error.Code);
    }

    [Fact]
    public void ReserveStock_InsufficientWithBackorder_AllowsNegative()
    {
        var variant = Variant(qty: 3, backorder: true);

        var result = variant.ReserveStock(5);

        Assert.True(result.IsSuccess);
        Assert.Equal(-2, variant.Quantity);
    }

    [Fact]
    public void AdjustStock_ResultingNegative_Fails()
    {
        var variant = Variant(qty: 2);

        var result = variant.AdjustStock(-5, "correction");

        Assert.True(result.IsFailure);
        Assert.Equal("ProductVariant.InvalidStockAdjustment", result.Error.Code);
    }

    [Fact]
    public void GetAttributesDisplayString_JoinsPairs()
    {
        var variant = Variant();

        Assert.Contains("Color: Red", variant.GetAttributesDisplayString());
        Assert.Contains("Size: M", variant.GetAttributesDisplayString());
    }
}
