using Qaflaty.Domain.Common.ValueObjects;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Common;

public class MoneyTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(0.01)]
    [InlineData(199.99)]
    public void Create_WithNonNegativeAmount_Succeeds(decimal amount)
    {
        var result = Money.Create(amount);

        Assert.True(result.IsSuccess);
        Assert.Equal(amount, result.Value.Amount);
    }

    [Theory]
    [InlineData(-0.01)]
    [InlineData(-100)]
    public void Create_WithNegativeAmount_Fails(decimal amount)
    {
        var result = Money.Create(amount);

        Assert.True(result.IsFailure);
        Assert.Equal("Money.NegativeAmount", result.Error.Code);
    }

    [Fact]
    public void Zero_HasZeroAmount()
    {
        Assert.Equal(0m, Money.Zero().Amount);
    }

    [Fact]
    public void Add_SumsAmounts()
    {
        var result = Money.Create(10m).Value.Add(Money.Create(5.5m).Value);

        Assert.Equal(15.5m, result.Amount);
    }

    [Fact]
    public void Subtract_WithSmallerOperand_ReturnsDifference()
    {
        var result = Money.Create(10m).Value.Subtract(Money.Create(3m).Value);

        Assert.Equal(7m, result.Amount);
    }

    [Fact]
    public void Subtract_ResultingInNegative_Throws()
    {
        var a = Money.Create(3m).Value;
        var b = Money.Create(10m).Value;

        Assert.Throws<InvalidOperationException>(() => a.Subtract(b));
    }

    [Fact]
    public void Multiply_ByFactor_ScalesAmount()
    {
        var result = Money.Create(10m).Value.Multiply(3m);

        Assert.Equal(30m, result.Amount);
    }

    [Fact]
    public void Multiply_ByNegativeFactor_Throws()
    {
        var money = Money.Create(10m).Value;

        Assert.Throws<ArgumentException>(() => money.Multiply(-1m));
    }

    [Fact]
    public void Operators_MatchMethodBehavior()
    {
        var a = Money.Create(10m).Value;
        var b = Money.Create(4m).Value;

        Assert.Equal(14m, (a + b).Amount);
        Assert.Equal(6m, (a - b).Amount);
        Assert.Equal(20m, (a * 2m).Amount);
        Assert.Equal(20m, (2m * a).Amount);
    }

    [Fact]
    public void Equality_IsByValue()
    {
        var a = Money.Create(99.99m).Value;
        var b = Money.Create(99.99m).Value;
        var c = Money.Create(50m).Value;

        Assert.Equal(a, b);
        Assert.True(a == b);
        Assert.NotEqual(a, c);
        Assert.True(a != c);
    }
}
