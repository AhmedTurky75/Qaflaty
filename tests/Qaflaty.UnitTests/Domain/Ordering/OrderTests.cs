using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Aggregates.Order.Events;
using Qaflaty.Domain.Ordering.Enums;
using Xunit;
using static Qaflaty.UnitTests.Domain.Ordering.TestOrderFactory;

namespace Qaflaty.UnitTests.Domain.Ordering;

public class OrderTests
{
    [Fact]
    public void Create_StartsPending_WithZeroTotal()
    {
        var order = NewOrder();

        Assert.Equal(OrderStatus.Pending, order.Status);
        Assert.Empty(order.Items);
        Assert.Equal(0m, order.Pricing.Total.Amount);
        Assert.Equal(PaymentStatus.Pending, order.Payment.Status);
    }

    // ---------- Item management ----------

    [Fact]
    public void AddItem_AddsLineAndRecalculatesPricing()
    {
        var order = NewOrder(deliveryFee: 20m);

        var result = order.AddItem(ProductId.New(), "Shirt", M(100m), 2);

        Assert.True(result.IsSuccess);
        Assert.Single(order.Items);
        Assert.Equal(200m, order.Pricing.Subtotal.Amount);
        Assert.Equal(220m, order.Pricing.Total.Amount); // subtotal + delivery
    }

    [Fact]
    public void AddItem_SameProductTwice_MergesQuantity()
    {
        var order = NewOrder();
        var productId = ProductId.New();

        order.AddItem(productId, "Shirt", M(50m), 1);
        order.AddItem(productId, "Shirt", M(50m), 2);

        Assert.Single(order.Items);
        Assert.Equal(3, order.Items[0].Quantity);
    }

    [Fact]
    public void AddItem_AfterConfirmed_Fails()
    {
        var order = NewOrderWithItem();
        order.Confirm("system");

        var result = order.AddItem(ProductId.New(), "Late", M(10m), 1);

        Assert.True(result.IsFailure);
        Assert.Equal("Ordering.OrderAlreadyConfirmed", result.Error.Code);
    }

    [Fact]
    public void RemoveItem_RemovesAndRecalculates()
    {
        var order = NewOrder();
        var productId = ProductId.New();
        order.AddItem(productId, "Shirt", M(100m), 1);

        var result = order.RemoveItem(productId);

        Assert.True(result.IsSuccess);
        Assert.Empty(order.Items);
        Assert.Equal(0m, order.Pricing.Total.Amount);
    }

    [Fact]
    public void RemoveItem_NotFound_Fails()
    {
        var order = NewOrderWithItem();

        var result = order.RemoveItem(ProductId.New());

        Assert.True(result.IsFailure);
        Assert.Equal("Ordering.ItemNotFound", result.Error.Code);
    }

    [Fact]
    public void UpdateItemQuantity_InvalidQuantity_Fails()
    {
        var order = NewOrder();
        var productId = ProductId.New();
        order.AddItem(productId, "Shirt", M(100m), 1);

        var result = order.UpdateItemQuantity(productId, 0);

        Assert.True(result.IsFailure);
        Assert.Equal("Ordering.InvalidQuantity", result.Error.Code);
    }

    // ---------- Status transitions ----------

    [Fact]
    public void Confirm_EmptyOrder_Fails()
    {
        var order = NewOrder();

        var result = order.Confirm("system");

        Assert.True(result.IsFailure);
        Assert.Equal("Ordering.EmptyOrder", result.Error.Code);
        Assert.Equal(OrderStatus.Pending, order.Status);
    }

    [Fact]
    public void Confirm_WithItems_TransitionsAndRaisesEvents()
    {
        var order = NewOrderWithItem();

        var result = order.Confirm("system");

        Assert.True(result.IsSuccess);
        Assert.Equal(OrderStatus.Confirmed, order.Status);
        Assert.Contains(order.DomainEvents, e => e is OrderConfirmedEvent);
        Assert.Contains(order.DomainEvents, e => e is OrderPlacedEvent);
        Assert.Single(order.StatusHistory);
    }

    [Fact]
    public void Confirm_Twice_Fails()
    {
        var order = NewOrderWithItem();
        order.Confirm("system");

        var result = order.Confirm("system");

        Assert.True(result.IsFailure);
        Assert.Equal("Ordering.InvalidStatusTransition", result.Error.Code);
    }

    [Fact]
    public void FullHappyPath_Cod_ReachesDelivered()
    {
        var order = NewOrderWithItem(paymentMethod: PaymentMethod.CashOnDelivery);

        Assert.True(order.Confirm("system").IsSuccess);
        Assert.True(order.Process("system").IsSuccess);
        Assert.True(order.Ship("system", carrier: "Aramex").IsSuccess);
        Assert.True(order.Deliver("system").IsSuccess);

        Assert.Equal(OrderStatus.Delivered, order.Status);
        Assert.NotNull(order.Shipment);
    }

    [Fact]
    public void Process_FromPending_Fails()
    {
        var order = NewOrderWithItem();

        var result = order.Process("system");

        Assert.True(result.IsFailure);
        Assert.Equal("Ordering.InvalidStatusTransition", result.Error.Code);
    }

    [Fact]
    public void Ship_NonCodWithoutPayment_Fails()
    {
        var order = NewOrderWithItem(paymentMethod: PaymentMethod.Card);
        order.Confirm("system");
        order.Process("system");

        var result = order.Ship("system");

        Assert.True(result.IsFailure);
        Assert.Equal("Ordering.PaymentRequired", result.Error.Code);
    }

    [Fact]
    public void Ship_NonCodAfterPayment_Succeeds()
    {
        var order = NewOrderWithItem(paymentMethod: PaymentMethod.Card);
        order.Confirm("system");
        order.Process("system");
        order.ProcessPayment("txn-123");

        var result = order.Ship("system");

        Assert.True(result.IsSuccess);
        Assert.Equal(OrderStatus.Shipped, order.Status);
    }

    [Fact]
    public void Cancel_FromPending_Succeeds()
    {
        var order = NewOrderWithItem();

        var result = order.Cancel("changed mind", "system");

        Assert.True(result.IsSuccess);
        Assert.Equal(OrderStatus.Cancelled, order.Status);
        Assert.Contains(order.DomainEvents, e => e is OrderCancelledEvent);
    }

    [Fact]
    public void Cancel_WhenDelivered_Fails()
    {
        var order = NewOrderWithItem();
        order.Confirm("system");
        order.Process("system");
        order.Ship("system");
        order.Deliver("system");

        var result = order.Cancel("too late", "system");

        Assert.True(result.IsFailure);
        Assert.Equal("Ordering.InvalidStatusTransition", result.Error.Code);
    }

    // ---------- Payment ----------

    [Fact]
    public void ProcessPayment_MarksPaidAndRaisesEvent()
    {
        var order = NewOrderWithItem(paymentMethod: PaymentMethod.Card);

        var result = order.ProcessPayment("txn-abc");

        Assert.True(result.IsSuccess);
        Assert.Equal(PaymentStatus.Paid, order.Payment.Status);
        Assert.Equal("txn-abc", order.Payment.TransactionId);
        Assert.Contains(order.DomainEvents, e => e is PaymentProcessedEvent);
    }

    [Fact]
    public void Refund_WhenNotPaid_Fails()
    {
        var order = NewOrderWithItem(paymentMethod: PaymentMethod.Card);

        var result = order.Refund("txn-refund");

        Assert.True(result.IsFailure);
        Assert.Equal("Ordering.PaymentFailed", result.Error.Code);
    }

    [Fact]
    public void Refund_WhenPaid_Succeeds()
    {
        var order = NewOrderWithItem(paymentMethod: PaymentMethod.Card);
        order.ProcessPayment("txn-abc");

        var result = order.Refund("txn-refund");

        Assert.True(result.IsSuccess);
        Assert.Equal(PaymentStatus.Refunded, order.Payment.Status);
    }

    // ---------- Discount ----------

    [Fact]
    public void ApplyDiscount_ReducesTotalAndStoresCode()
    {
        var order = NewOrder();
        order.AddItem(ProductId.New(), "Shirt", M(100m), 1);

        var result = order.ApplyDiscount("SAVE20", M(20m));

        Assert.True(result.IsSuccess);
        Assert.Equal("SAVE20", order.AppliedPromoCode);
        Assert.Equal(20m, order.Pricing.DiscountAmount.Amount);
        Assert.Equal(80m, order.Pricing.Total.Amount);
    }

    [Fact]
    public void ApplyDiscount_AfterConfirmed_Fails()
    {
        var order = NewOrderWithItem();
        order.Confirm("system");

        var result = order.ApplyDiscount("SAVE20", M(20m));

        Assert.True(result.IsFailure);
        Assert.Equal("Ordering.OrderAlreadyConfirmed", result.Error.Code);
    }
}
