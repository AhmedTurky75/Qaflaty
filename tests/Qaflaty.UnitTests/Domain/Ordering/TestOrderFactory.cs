using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Ordering.Aggregates.Order;
using Qaflaty.Domain.Ordering.Enums;
using Qaflaty.Domain.Ordering.ValueObjects;

namespace Qaflaty.UnitTests.Domain.Ordering;

/// <summary>
/// Test helpers for constructing valid <see cref="Order"/> aggregates without repeating
/// the value-object plumbing in every test.
/// </summary>
internal static class TestOrderFactory
{
    public static Money M(decimal amount) => Money.Create(amount).Value;

    public static DeliveryInfo Delivery()
    {
        var address = Address.Create("King Fahd Rd", "Riyadh", country: "Saudi Arabia").Value;
        return DeliveryInfo.Create(address);
    }

    /// <summary>Creates a Pending order with no items and no delivery fee.</summary>
    public static Order NewOrder(
        PaymentMethod paymentMethod = PaymentMethod.CashOnDelivery,
        decimal deliveryFee = 0m,
        decimal taxRatePercent = 0m,
        bool pricesIncludeTax = false)
    {
        return Order.Create(
            StoreId.New(),
            CustomerId.New(),
            OrderNumber.Generate(),
            Delivery(),
            paymentMethod,
            M(deliveryFee),
            taxRatePercent: taxRatePercent,
            pricesIncludeTax: pricesIncludeTax).Value;
    }

    /// <summary>Creates a Pending order with a single line item (unitPrice x quantity).</summary>
    public static Order NewOrderWithItem(
        decimal unitPrice = 100m,
        int quantity = 1,
        PaymentMethod paymentMethod = PaymentMethod.CashOnDelivery,
        decimal deliveryFee = 0m)
    {
        var order = NewOrder(paymentMethod, deliveryFee);
        order.AddItem(ProductId.New(), "Test Product", M(unitPrice), quantity);
        return order;
    }
}
