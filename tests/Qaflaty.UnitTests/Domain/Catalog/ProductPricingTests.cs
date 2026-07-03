using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.ValueObjects;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Catalog;

public class ProductPricingTests
{
    private static Money M(decimal a) => Money.Create(a).Value;

    [Fact]
    public void Create_WithPositivePrice_Succeeds_NoDiscount()
    {
        var result = ProductPricing.Create(M(100m));

        Assert.True(result.IsSuccess);
        Assert.False(result.Value.HasDiscount);
        Assert.Equal(0m, result.Value.DiscountPercentage);
        Assert.Null(result.Value.DiscountAmount);
    }

    [Fact]
    public void Create_ZeroPrice_Fails()
    {
        var result = ProductPricing.Create(M(0m));

        Assert.True(result.IsFailure);
        Assert.Equal("Catalog.InvalidPricing", result.Error.Code);
    }

    [Fact]
    public void Create_CompareAtBelowOrEqualPrice_Fails()
    {
        var result = ProductPricing.Create(M(100m), M(100m));

        Assert.True(result.IsFailure);
        Assert.Equal("Catalog.CompareAtPriceTooLow", result.Error.Code);
    }

    [Fact]
    public void Create_WithValidCompareAt_ComputesDiscount()
    {
        var result = ProductPricing.Create(M(80m), M(100m));

        Assert.True(result.IsSuccess);
        Assert.True(result.Value.HasDiscount);
        Assert.Equal(20m, result.Value.DiscountPercentage);
        Assert.Equal(20m, result.Value.DiscountAmount!.Amount);
    }
}
