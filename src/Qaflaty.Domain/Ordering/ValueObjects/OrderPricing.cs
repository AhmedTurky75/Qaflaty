using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Ordering.Aggregates.Order;

namespace Qaflaty.Domain.Ordering.ValueObjects;

public sealed class OrderPricing : ValueObject
{
    public Money Subtotal { get; private set; } = null!;
    public Money DeliveryFee { get; private set; } = null!;
    public Money DiscountAmount { get; private set; } = null!;
    public Money TaxAmount { get; private set; } = null!;
    public Money Total { get; private set; } = null!;

    private OrderPricing() { }

    private OrderPricing(Money subtotal, Money deliveryFee, Money discountAmount, Money taxAmount, Money total)
    {
        Subtotal = subtotal;
        DeliveryFee = deliveryFee;
        DiscountAmount = discountAmount;
        TaxAmount = taxAmount;
        Total = total;
    }

    /// <summary>
    /// Recomputes pricing from the line items. <paramref name="taxRatePercent"/> is a percentage
    /// (e.g. 15 = 15%). When <paramref name="pricesIncludeTax"/> is true the tax is already contained
    /// in the line prices and is reported for information; otherwise it is added on top.
    /// </summary>
    public static OrderPricing Calculate(
        IEnumerable<OrderItem> items,
        Money deliveryFee,
        Money? discountAmount = null,
        decimal taxRatePercent = 0m,
        bool pricesIncludeTax = false)
    {
        var currency = deliveryFee.Currency;

        var subtotal = items.Aggregate(
            Money.Zero(currency),
            (acc, item) => acc.Add(item.Total));

        var discount = discountAmount ?? Money.Zero(currency);

        var gross = subtotal.Add(deliveryFee);
        var effectiveDiscount = discount.Amount > gross.Amount ? gross : discount;

        // Net amount payable before adding any tax that sits on top of the prices.
        var net = gross.Subtract(effectiveDiscount);

        var rate = taxRatePercent / 100m;
        decimal taxValue = 0m;
        decimal totalValue = net.Amount;

        if (rate > 0m)
        {
            if (pricesIncludeTax)
            {
                // Tax is already inside `net`; report the portion without changing the total.
                taxValue = Math.Round(net.Amount - net.Amount / (1m + rate), 2);
            }
            else
            {
                taxValue = Math.Round(net.Amount * rate, 2);
                totalValue = net.Amount + taxValue;
            }
        }

        var tax = Money.Create(taxValue, currency).Value;
        var total = Money.Create(totalValue, currency).Value;

        return new OrderPricing(subtotal, deliveryFee, effectiveDiscount, tax, total);
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Subtotal;
        yield return DeliveryFee;
        yield return DiscountAmount;
        yield return TaxAmount;
        yield return Total;
    }
}
