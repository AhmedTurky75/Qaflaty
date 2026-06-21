using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Ordering.Aggregates.Order;

namespace Qaflaty.Domain.Ordering.ValueObjects;

public sealed class OrderPricing : ValueObject
{
    public Money Subtotal { get; private set; } = null!;
    public Money DeliveryFee { get; private set; } = null!;
    public Money DiscountAmount { get; private set; } = null!;
    public Money Total { get; private set; } = null!;

    private OrderPricing() { }

    private OrderPricing(Money subtotal, Money deliveryFee, Money discountAmount, Money total)
    {
        Subtotal = subtotal;
        DeliveryFee = deliveryFee;
        DiscountAmount = discountAmount;
        Total = total;
    }

    public static OrderPricing Calculate(IEnumerable<OrderItem> items, Money deliveryFee, Money? discountAmount = null)
    {
        var subtotal = items.Aggregate(
            Money.Zero(deliveryFee.Currency),
            (acc, item) => acc.Add(item.Total));

        var discount = discountAmount ?? Money.Zero(deliveryFee.Currency);

        // Guard against a discount larger than subtotal + delivery, which would make a negative total.
        var gross = subtotal.Add(deliveryFee);
        var effectiveDiscount = discount.Amount > gross.Amount
            ? gross
            : discount;

        var total = gross.Subtract(effectiveDiscount);

        return new OrderPricing(subtotal, deliveryFee, effectiveDiscount, total);
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Subtotal;
        yield return DeliveryFee;
        yield return DiscountAmount;
        yield return Total;
    }
}
