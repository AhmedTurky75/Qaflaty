using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Ordering.Aggregates.Order.Events;
using Qaflaty.Domain.Ordering.Enums;
using Qaflaty.Domain.Ordering.Errors;
using Qaflaty.Domain.Ordering.ValueObjects;

namespace Qaflaty.Domain.Ordering.Aggregates.Order;

public sealed class Order : AggregateRoot<OrderId>
{
    public StoreId StoreId { get; private set; }
    public CustomerId CustomerId { get; private set; }
    public OrderNumber OrderNumber { get; private set; } = null!;
    public OrderStatus Status { get; private set; }
    public OrderPricing Pricing { get; private set; } = null!;
    public PaymentInfo Payment { get; private set; } = null!;
    public DeliveryInfo Delivery { get; private set; } = null!;
    public OrderNotes Notes { get; private set; } = null!;
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private readonly List<OrderItem> _items = [];
    public IReadOnlyList<OrderItem> Items => _items.AsReadOnly();

    private readonly List<OrderStatusChange> _statusHistory = [];
    public IReadOnlyList<OrderStatusChange> StatusHistory => _statusHistory.AsReadOnly();

    private Order() : base(OrderId.Empty) { }

    public static Result<Order> Create(
        StoreId storeId,
        CustomerId customerId,
        OrderNumber orderNumber,
        DeliveryInfo delivery,
        PaymentMethod paymentMethod,
        Money deliveryFee,
        string? customerNotes = null)
    {
        var order = new Order
        {
            Id = OrderId.New(),
            StoreId = storeId,
            CustomerId = customerId,
            OrderNumber = orderNumber,
            Status = OrderStatus.Pending,
            Delivery = delivery,
            Payment = PaymentInfo.Create(paymentMethod),
            Notes = OrderNotes.Create(customerNotes),
            Pricing = OrderPricing.Calculate([], deliveryFee),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        return Result.Success(order);
    }

    public Result AddItem(ProductId productId, string productName, Money unitPrice, int quantity)
    {
        if (Status != OrderStatus.Pending)
            return Result.Failure(OrderingErrors.OrderAlreadyConfirmed);

        var itemResult = OrderItem.Create(productId, productName, unitPrice, quantity);
        if (itemResult.IsFailure)
            return Result.Failure(itemResult.Error);

        var existingItem = _items.FirstOrDefault(i => i.ProductId.Value == productId.Value);
        if (existingItem != null)
        {
            //Question : Why we return witout RecalculatePricing again ?
            return existingItem.UpdateQuantity(existingItem.Quantity + quantity);
        }

        _items.Add(itemResult.Value);
        RecalculatePricing();
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result RemoveItem(ProductId productId)
    {
        if (Status != OrderStatus.Pending)
            return Result.Failure(OrderingErrors.OrderAlreadyConfirmed);

        var item = _items.FirstOrDefault(i => i.ProductId.Value == productId.Value);
        if (item == null)
            return Result.Failure(OrderingErrors.ItemNotFound);

        _items.Remove(item);
        RecalculatePricing();
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result UpdateItemQuantity(ProductId productId, int newQuantity)
    {
        if (Status != OrderStatus.Pending)
            return Result.Failure(OrderingErrors.OrderAlreadyConfirmed);

        var item = _items.FirstOrDefault(i => i.ProductId.Value == productId.Value);
        if (item == null)
            return Result.Failure(OrderingErrors.ItemNotFound);

        var result = item.UpdateQuantity(newQuantity);
        if (result.IsSuccess)
        {
            RecalculatePricing();
            UpdatedAt = DateTime.UtcNow;
        }
        return result;
    }

    public Result Confirm()
    {
        if (Status != OrderStatus.Pending)
            return Result.Failure(OrderingErrors.InvalidStatusTransition);

        if (!_items.Any())
            return Result.Failure(OrderingErrors.EmptyOrder);

        ChangeStatus(OrderStatus.Confirmed);
        RaiseDomainEvent(new OrderConfirmedEvent(Id));

        var itemSnapshots = _items.Select(i => new OrderItemSnapshot(i.ProductId, i.Quantity)).ToList();
        RaiseDomainEvent(new OrderPlacedEvent(Id, StoreId, CustomerId, OrderNumber, itemSnapshots, Pricing.Total));

        return Result.Success();
    }

    public Result Process()
    {
        if (Status != OrderStatus.Confirmed)
            return Result.Failure(OrderingErrors.InvalidStatusTransition);

        ChangeStatus(OrderStatus.Processing);
        return Result.Success();
    }

    public Result Ship()
    {
        if (Status != OrderStatus.Processing)
            return Result.Failure(OrderingErrors.InvalidStatusTransition);

        if (Payment.Method != PaymentMethod.CashOnDelivery && Payment.Status != PaymentStatus.Paid)
            return Result.Failure(OrderingErrors.PaymentRequired);

        ChangeStatus(OrderStatus.Shipped);
        RaiseDomainEvent(new OrderShippedEvent(Id));
        return Result.Success();
    }

    public Result Deliver()
    {
        if (Status != OrderStatus.Shipped)
            return Result.Failure(OrderingErrors.InvalidStatusTransition);

        ChangeStatus(OrderStatus.Delivered);
        RaiseDomainEvent(new OrderDeliveredEvent(Id));
        return Result.Success();
    }

    public Result Cancel(string reason)
    {
        if (Status == OrderStatus.Delivered || Status == OrderStatus.Cancelled)
            return Result.Failure(OrderingErrors.InvalidStatusTransition);

        ChangeStatus(OrderStatus.Cancelled, reason);
        RaiseDomainEvent(new OrderCancelledEvent(Id, reason));
        return Result.Success();
    }

    public Result ProcessPayment(string transactionId)
    {
        if (Payment.Status == PaymentStatus.Paid)
            return Result.Success();

        Payment.MarkAsPaid(transactionId);
        UpdatedAt = DateTime.UtcNow;
        RaiseDomainEvent(new PaymentProcessedEvent(Id, transactionId, Pricing.Total));
        return Result.Success();
    }

    public Result FailPayment(string reason)
    {
        Payment.MarkAsFailed(reason);
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result Refund(string transactionId)
    {
        if (Payment.Status != PaymentStatus.Paid)
            return Result.Failure(OrderingErrors.PaymentFailed);

        Payment.MarkAsRefunded(transactionId);
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public void AddMerchantNote(string note)
    {
        Notes.AddMerchantNote(note);
        UpdatedAt = DateTime.UtcNow;
    }

    private void ChangeStatus(OrderStatus newStatus, string? notes = null)
    {
        //Question : Why always changedBy = "System" ?
        var statusChange = OrderStatusChange.Create(Status, newStatus, "System", notes);
        _statusHistory.Add(statusChange);
        Status = newStatus;
        UpdatedAt = DateTime.UtcNow;
    }

    private void RecalculatePricing()
    {
        Pricing = OrderPricing.Calculate(_items, Pricing.DeliveryFee);
    }
}
