using Qaflaty.Domain.Catalog.Aggregates.PromoCode;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Common.Identifiers;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Catalog;

public class PromoCodeTests
{
    private static PromoCode Percentage(
        decimal value = 20m,
        decimal? min = null,
        decimal? maxDiscount = null,
        DateTime? startsAt = null,
        DateTime? expiresAt = null,
        int? usageLimit = null,
        int? perCustomer = null)
        => PromoCode.Create(StoreId.New(), "summer20", "desc", PromoDiscountType.Percentage,
            value, min, maxDiscount, startsAt, expiresAt, usageLimit, perCustomer).Value;

    // ---------- Creation / normalization ----------

    [Fact]
    public void Create_NormalizesCodeToUppercase()
    {
        var promo = Percentage();

        Assert.Equal("SUMMER20", promo.Code);
        Assert.True(promo.IsActive);
        Assert.Equal(0, promo.TimesUsed);
    }

    [Fact]
    public void Create_BlankCode_Fails()
    {
        var result = PromoCode.Create(StoreId.New(), "  ", null, PromoDiscountType.FixedAmount,
            10m, null, null, null, null, null, null);

        Assert.True(result.IsFailure);
        Assert.Equal("PromoCode.CodeRequired", result.Error.Code);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(101)]
    [InlineData(-5)]
    public void Create_InvalidPercentage_Fails(decimal value)
    {
        var result = PromoCode.Create(StoreId.New(), "X", null, PromoDiscountType.Percentage,
            value, null, null, null, null, null, null);

        Assert.True(result.IsFailure);
        Assert.Equal("PromoCode.InvalidPercentage", result.Error.Code);
    }

    [Fact]
    public void Create_FixedAmountZero_Fails()
    {
        var result = PromoCode.Create(StoreId.New(), "X", null, PromoDiscountType.FixedAmount,
            0m, null, null, null, null, null, null);

        Assert.True(result.IsFailure);
        Assert.Equal("PromoCode.InvalidValue", result.Error.Code);
    }

    [Fact]
    public void Create_FreeShipping_ForcesValueToZero()
    {
        var promo = PromoCode.Create(StoreId.New(), "SHIP", null, PromoDiscountType.FreeShipping,
            99m, null, null, null, null, null, null).Value;

        Assert.Equal(0, promo.Value);
    }

    // ---------- Validate ----------

    [Fact]
    public void Validate_ActiveWithinLimits_Succeeds()
    {
        var promo = Percentage(min: 50m, usageLimit: 100, perCustomer: 2);

        var result = promo.Validate(subtotal: 100m, DateTime.UtcNow, customerRedemptionCount: 0);

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void Validate_Inactive_Fails()
    {
        var promo = Percentage();
        promo.Deactivate();

        var result = promo.Validate(100m, DateTime.UtcNow, 0);

        Assert.True(result.IsFailure);
        Assert.Equal("PromoCode.Inactive", result.Error.Code);
    }

    [Fact]
    public void Validate_BeforeStart_Fails()
    {
        var now = DateTime.UtcNow;
        var promo = Percentage(startsAt: now.AddDays(1));

        var result = promo.Validate(100m, now, 0);

        Assert.True(result.IsFailure);
        Assert.Equal("PromoCode.NotStarted", result.Error.Code);
    }

    [Fact]
    public void Validate_AfterExpiry_Fails()
    {
        var now = DateTime.UtcNow;
        var promo = Percentage(expiresAt: now.AddDays(-1));

        var result = promo.Validate(100m, now, 0);

        Assert.True(result.IsFailure);
        Assert.Equal("PromoCode.Expired", result.Error.Code);
    }

    [Fact]
    public void Validate_BelowMinimumOrder_Fails()
    {
        var promo = Percentage(min: 200m);

        var result = promo.Validate(subtotal: 100m, DateTime.UtcNow, 0);

        Assert.True(result.IsFailure);
        Assert.Equal("PromoCode.MinimumOrderNotMet", result.Error.Code);
    }

    [Fact]
    public void Validate_UsageLimitReached_Fails()
    {
        var promo = Percentage(usageLimit: 1);
        promo.RecordRedemption(); // TimesUsed = 1

        var result = promo.Validate(100m, DateTime.UtcNow, 0);

        Assert.True(result.IsFailure);
        Assert.Equal("PromoCode.UsageLimitReached", result.Error.Code);
    }

    [Fact]
    public void Validate_CustomerLimitReached_Fails()
    {
        var promo = Percentage(perCustomer: 1);

        var result = promo.Validate(100m, DateTime.UtcNow, customerRedemptionCount: 1);

        Assert.True(result.IsFailure);
        Assert.Equal("PromoCode.CustomerLimitReached", result.Error.Code);
    }

    // ---------- CalculateDiscount ----------

    [Fact]
    public void CalculateDiscount_Percentage_AppliesRate()
    {
        var promo = Percentage(value: 20m);

        Assert.Equal(20m, promo.CalculateDiscount(subtotal: 100m, deliveryFee: 30m));
    }

    [Fact]
    public void CalculateDiscount_Percentage_CappedByMaxDiscount()
    {
        var promo = Percentage(value: 50m, maxDiscount: 30m);

        // 50% of 100 = 50, capped at 30
        Assert.Equal(30m, promo.CalculateDiscount(100m, 0m));
    }

    [Fact]
    public void CalculateDiscount_FixedAmount_NeverExceedsSubtotal()
    {
        var promo = PromoCode.Create(StoreId.New(), "BIG", null, PromoDiscountType.FixedAmount,
            500m, null, null, null, null, null, null).Value;

        // fixed 500 but subtotal only 100 => capped at 100
        Assert.Equal(100m, promo.CalculateDiscount(100m, 0m));
    }

    [Fact]
    public void CalculateDiscount_FreeShipping_EqualsDeliveryFee()
    {
        var promo = PromoCode.Create(StoreId.New(), "SHIP", null, PromoDiscountType.FreeShipping,
            0m, null, null, null, null, null, null).Value;

        Assert.Equal(25m, promo.CalculateDiscount(subtotal: 100m, deliveryFee: 25m));
    }

    [Fact]
    public void RecordRedemption_IncrementsTimesUsed()
    {
        var promo = Percentage();

        promo.RecordRedemption();
        promo.RecordRedemption();

        Assert.Equal(2, promo.TimesUsed);
    }
}
