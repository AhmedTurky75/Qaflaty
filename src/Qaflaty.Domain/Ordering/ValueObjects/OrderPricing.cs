using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Ordering.Aggregates.Order;

namespace Qaflaty.Domain.Ordering.ValueObjects;

public sealed class OrderPricing : ValueObject
{
    public Money Subtotal { get; private set; } = null!;
    public Money DeliveryFee { get; private set; } = null!;
    public Money Total { get; private set; } = null!;

    private OrderPricing() { }

    private OrderPricing(Money subtotal, Money deliveryFee, Money total)
    {
        Subtotal = subtotal;
        DeliveryFee = deliveryFee;
        Total = total;
    }

    public static OrderPricing Calculate(IEnumerable<OrderItem> items, Money deliveryFee)
    {
        var subtotal = items.Aggregate(
            Money.Zero(deliveryFee.Currency),
            (acc, item) => acc.Add(item.Total));

        var total = subtotal.Add(deliveryFee);

        return new OrderPricing(subtotal, deliveryFee, total);
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Subtotal;
        yield return DeliveryFee;
        yield return Total;
    }
}
