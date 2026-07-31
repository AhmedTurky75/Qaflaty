using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Aggregates.Order;
using Qaflaty.Domain.Ordering.ValueObjects;
using Xunit;
using static Qaflaty.UnitTests.Domain.Ordering.TestOrderFactory;

namespace Qaflaty.UnitTests.Domain.Ordering;

public class OrderPricingTests
{
    private static OrderItem Item(decimal unitPrice, int qty) =>
        OrderItem.Create(ProductId.New(), "P", M(unitPrice), qty).Value;

    [Fact]
    public void Calculate_NoItems_IsAllZeroExceptDelivery()
    {
        var pricing = OrderPricing.Calculate([], M(15m));

        Assert.Equal(0m, pricing.Subtotal.Amount);
        Assert.Equal(15m, pricing.DeliveryFee.Amount);
        Assert.Equal(0m, pricing.DiscountAmount.Amount);
        Assert.Equal(0m, pricing.TaxAmount.Amount);
        Assert.Equal(15m, pricing.Total.Amount);
    }

    [Fact]
    public void Calculate_SumsLineTotalsPlusDelivery()
    {
        var items = new[] { Item(100m, 2), Item(50m, 1) }; // 250

        var pricing = OrderPricing.Calculate(items, M(30m));

        Assert.Equal(250m, pricing.Subtotal.Amount);
        Assert.Equal(280m, pricing.Total.Amount);
    }

    [Fact]
    public void Calculate_AppliesDiscount()
    {
        var items = new[] { Item(100m, 1) };

        var pricing = OrderPricing.Calculate(items, M(0m), M(30m));

        Assert.Equal(30m, pricing.DiscountAmount.Amount);
        Assert.Equal(70m, pricing.Total.Amount);
    }

    [Fact]
    public void Calculate_DiscountLargerThanGross_IsCappedAtGross()
    {
        var items = new[] { Item(100m, 1) }; // gross = 100 + 20 delivery = 120

        var pricing = OrderPricing.Calculate(items, M(20m), M(500m));

        Assert.Equal(120m, pricing.DiscountAmount.Amount); // capped, not 500
        Assert.Equal(0m, pricing.Total.Amount);            // never negative
    }

    [Fact]
    public void Calculate_TaxExclusive_AddsTaxOnTop()
    {
        var items = new[] { Item(100m, 1) };

        // 15% VAT added on top of 100 net => tax 15, total 115
        var pricing = OrderPricing.Calculate(items, M(0m), null, 15m, pricesIncludeTax: false);

        Assert.Equal(15m, pricing.TaxAmount.Amount);
        Assert.Equal(115m, pricing.Total.Amount);
    }

    [Fact]
    public void Calculate_TaxInclusive_ReportsTaxWithoutChangingTotal()
    {
        var items = new[] { Item(115m, 1) };

        // 15% already inside 115 => tax portion 15, total stays 115
        var pricing = OrderPricing.Calculate(items, M(0m), null, 15m, pricesIncludeTax: true);

        Assert.Equal(15m, pricing.TaxAmount.Amount);
        Assert.Equal(115m, pricing.Total.Amount);
    }

    [Fact]
    public void Calculate_TaxAppliesToNetAfterDiscount()
    {
        var items = new[] { Item(100m, 1) };

        // net after discount = (100 - 20) = 80; 10% tax => 8; total 88
        var pricing = OrderPricing.Calculate(items, M(0m), M(20m), 10m, pricesIncludeTax: false);

        Assert.Equal(8m, pricing.TaxAmount.Amount);
        Assert.Equal(88m, pricing.Total.Amount);
    }

    [Fact]
    public void Equality_IsByAllComponents()
    {
        var items = new[] { Item(100m, 1) };
        var a = OrderPricing.Calculate(items, M(10m));
        var b = OrderPricing.Calculate(items, M(10m));

        Assert.Equal(a, b);
    }
}
