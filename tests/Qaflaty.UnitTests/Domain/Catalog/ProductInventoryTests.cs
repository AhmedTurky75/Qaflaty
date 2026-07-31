using Qaflaty.Domain.Catalog.ValueObjects;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Catalog;

public class ProductInventoryTests
{
    [Fact]
    public void Create_NegativeQuantity_Fails()
    {
        var result = ProductInventory.Create(-1);

        Assert.True(result.IsFailure);
        Assert.Equal("Catalog.StockCannotBeNegative", result.Error.Code);
    }

    [Theory]
    [InlineData(0, false)]
    [InlineData(1, true)]
    [InlineData(100, true)]
    public void InStock_WhenTracked_ReflectsQuantity(int qty, bool expected)
    {
        var inv = ProductInventory.Create(qty, trackInventory: true).Value;

        Assert.Equal(expected, inv.InStock);
    }

    [Fact]
    public void InStock_WhenNotTracked_AlwaysTrue()
    {
        var inv = ProductInventory.Create(0, trackInventory: false).Value;

        Assert.True(inv.InStock);
        Assert.True(inv.CanFulfill(9999));
    }

    [Theory]
    [InlineData(5, true)]
    [InlineData(1, true)]
    [InlineData(6, false)]
    [InlineData(0, false)]
    public void LowStock_TrueBetweenOneAndFive(int qty, bool expected)
    {
        var inv = ProductInventory.Create(qty, trackInventory: true).Value;

        Assert.Equal(expected, inv.LowStock);
    }

    [Fact]
    public void Reserve_TrackedWithEnoughStock_Decrements()
    {
        var inv = ProductInventory.Create(10).Value;

        var result = inv.Reserve(4);

        Assert.True(result.IsSuccess);
        Assert.Equal(6, inv.Quantity);
    }

    [Fact]
    public void Reserve_TrackedInsufficient_Fails()
    {
        var inv = ProductInventory.Create(3).Value;

        var result = inv.Reserve(4);

        Assert.True(result.IsFailure);
        Assert.Equal("Catalog.InsufficientStock", result.Error.Code);
        Assert.Equal(3, inv.Quantity);
    }

    [Fact]
    public void Reserve_Untracked_AlwaysSucceeds_WithoutDecrement()
    {
        var inv = ProductInventory.Create(2, trackInventory: false).Value;

        var result = inv.Reserve(100);

        Assert.True(result.IsSuccess);
        Assert.Equal(2, inv.Quantity); // untracked stock is not decremented
    }

    [Fact]
    public void Restock_IncreasesQuantity()
    {
        var inv = ProductInventory.Create(5).Value;

        inv.Restock(10);

        Assert.Equal(15, inv.Quantity);
    }

    [Fact]
    public void Restock_Negative_Fails()
    {
        var inv = ProductInventory.Create(5).Value;

        var result = inv.Restock(-1);

        Assert.True(result.IsFailure);
        Assert.Equal("Catalog.StockCannotBeNegative", result.Error.Code);
    }
}
