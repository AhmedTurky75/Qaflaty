using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Aggregates.Order;
using Xunit;
using static Qaflaty.UnitTests.Domain.Ordering.TestOrderFactory;

namespace Qaflaty.UnitTests.Domain.Ordering;

public class OrderItemTests
{
    [Fact]
    public void Create_ValidQuantity_ComputesLineTotal()
    {
        var result = OrderItem.Create(ProductId.New(), "Shirt", M(25m), 4);

        Assert.True(result.IsSuccess);
        Assert.Equal(4, result.Value.Quantity);
        Assert.Equal(100m, result.Value.Total.Amount);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-3)]
    public void Create_NonPositiveQuantity_Fails(int quantity)
    {
        var result = OrderItem.Create(ProductId.New(), "Shirt", M(25m), quantity);

        Assert.True(result.IsFailure);
        Assert.Equal("Ordering.InvalidQuantity", result.Error.Code);
    }

    [Fact]
    public void UpdateQuantity_Valid_UpdatesTotal()
    {
        var item = OrderItem.Create(ProductId.New(), "Shirt", M(10m), 1).Value;

        var result = item.UpdateQuantity(5);

        Assert.True(result.IsSuccess);
        Assert.Equal(5, item.Quantity);
        Assert.Equal(50m, item.Total.Amount);
    }

    [Fact]
    public void UpdateQuantity_NonPositive_Fails()
    {
        var item = OrderItem.Create(ProductId.New(), "Shirt", M(10m), 1).Value;

        var result = item.UpdateQuantity(0);

        Assert.True(result.IsFailure);
        Assert.Equal("Ordering.InvalidQuantity", result.Error.Code);
        Assert.Equal(1, item.Quantity); // unchanged
    }
}
