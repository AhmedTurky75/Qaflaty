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
    public StoreId StoreId { get; private set; } // Store (tenant) the order was placed in
    public CustomerId CustomerId { get; private set; } // Customer who placed the order
    public OrderNumber OrderNumber { get; private set; } = null!; // Human-readable unique order reference shown to customer, e.g. "ORD-2026-000123"
    public OrderStatus Status { get; private set; } // Order lifecycle state: Pending → Confirmed → Processing → Shipped → Delivered (or Cancelled)
    public string? BlockReason { get; private set; } // Why the order was flagged against the merchant's phone blocklist; null for ordinary orders
    public OrderSource Source { get; private set; } // Channel the order originated from, e.g. Storefront (online) or Manual (merchant-entered)
    public OrderPricing Pricing { get; private set; } = null!; // Computed totals value object: subtotal, delivery fee, discount, tax, grand total
    public string? AppliedPromoCode { get; private set; } // Promo/discount code applied to the order, if any, e.g. "SUMMER20"
    public PaymentInfo Payment { get; private set; } = null!; // Payment value object: method (COD/card/…), status (Pending/Paid/Failed/Refunded), transaction id
    public DeliveryInfo Delivery { get; private set; } = null!; // Delivery value object: recipient contact + shipping address
    public ShipmentInfo? Shipment { get; private set; } // Shipment tracking value object set once shipped: carrier, tracking number/URL, ETA; null until shipped
    public OrderNotes Notes { get; private set; } = null!; // Notes value object holding customer note + merchant-internal notes
    public decimal TaxRate { get; private set; } // Tax/VAT percentage applied to this order at placement time, e.g. 15 for 15%
    public bool PricesIncludeTax { get; private set; } // Whether item prices are tax-inclusive (true) or tax is added on top (false)
    public DateTime CreatedAt { get; private set; } // UTC timestamp when the order was created/placed
    public DateTime UpdatedAt { get; private set; } // UTC timestamp of the last change to the order

    private readonly List<OrderItem> _items = []; // Backing list of line items
    public IReadOnlyList<OrderItem> Items => _items.AsReadOnly(); // Line items of the order, each a product + quantity + captured unit price

    private readonly List<OrderStatusChange> _statusHistory = []; // Backing list of status transitions
    public IReadOnlyList<OrderStatusChange> StatusHistory => _statusHistory.AsReadOnly(); // Audit trail of every status transition with timestamp, actor, and optional note

    private Order() : base(OrderId.Empty) { }

    public static Result<Order> Create(
        StoreId storeId,
        CustomerId customerId,
        OrderNumber orderNumber,
        DeliveryInfo delivery,
        PaymentMethod paymentMethod,
        Money deliveryFee,
        string? customerNotes = null,
        OrderSource source = OrderSource.Storefront,
        decimal taxRatePercent = 0m,
        bool pricesIncludeTax = false)
    {
        var order = new Order
        {
            Id = OrderId.New(),
            StoreId = storeId,
            CustomerId = customerId,
            OrderNumber = orderNumber,
            Status = OrderStatus.Pending,
            Source = source,
            Delivery = delivery,
            Payment = PaymentInfo.Create(paymentMethod),
            Notes = OrderNotes.Create(customerNotes),
            TaxRate = taxRatePercent,
            PricesIncludeTax = pricesIncludeTax,
            Pricing = OrderPricing.Calculate([], deliveryFee, null, taxRatePercent, pricesIncludeTax),
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

    public Result Confirm(string changedBy)
    {
        if (Status != OrderStatus.Pending)
            return Result.Failure(OrderingErrors.InvalidStatusTransition);

        if (!_items.Any())
            return Result.Failure(OrderingErrors.EmptyOrder);

        ChangeStatus(OrderStatus.Confirmed, changedBy);
        RaiseDomainEvent(new OrderConfirmedEvent(Id));

        var itemSnapshots = _items.Select(i => new OrderItemSnapshot(i.ProductId, i.Quantity)).ToList();
        RaiseDomainEvent(new OrderPlacedEvent(Id, StoreId, CustomerId, OrderNumber, itemSnapshots, Pricing.Total));

        return Result.Success();
    }

    public Result Process(string changedBy)
    {
        if (Status != OrderStatus.Confirmed)
            return Result.Failure(OrderingErrors.InvalidStatusTransition);

        ChangeStatus(OrderStatus.Processing, changedBy);
        return Result.Success();
    }

    public Result Ship(
        string changedBy,
        string? carrier = null,
        string? trackingNumber = null,
        string? trackingUrl = null,
        DateTime? estimatedDeliveryDate = null)
    {
        if (Status != OrderStatus.Processing)
            return Result.Failure(OrderingErrors.InvalidStatusTransition);

        if (Payment.Method != PaymentMethod.CashOnDelivery && Payment.Status != PaymentStatus.Paid)
            return Result.Failure(OrderingErrors.PaymentRequired);

        Shipment = ShipmentInfo.Create(carrier, trackingNumber, trackingUrl, estimatedDeliveryDate);
        ChangeStatus(OrderStatus.Shipped, changedBy);
        RaiseDomainEvent(new OrderShippedEvent(Id));
        return Result.Success();
    }

    public Result Deliver(string changedBy)
    {
        if (Status != OrderStatus.Shipped)
            return Result.Failure(OrderingErrors.InvalidStatusTransition);

        ChangeStatus(OrderStatus.Delivered, changedBy);
        RaiseDomainEvent(new OrderDeliveredEvent(Id));
        return Result.Success();
    }

    public Result Cancel(string reason, string changedBy)
    {
        if (Status == OrderStatus.Delivered || Status == OrderStatus.Cancelled)
            return Result.Failure(OrderingErrors.InvalidStatusTransition);

        // A Blocked order never reserved stock, so it must not travel through this path:
        // OrderCancelledEvent restores stock unconditionally and would inflate inventory.
        // Use RejectBlocked instead.
        if (Status == OrderStatus.Blocked)
            return Result.Failure(OrderingErrors.InvalidStatusTransition);

        ChangeStatus(OrderStatus.Cancelled, changedBy, reason);
        RaiseDomainEvent(new OrderCancelledEvent(Id, reason));
        return Result.Success();
    }

    /// <summary>
    /// Records that the order came from a blocked phone number, while leaving it Pending so the
    /// customer-facing flow (including OTP verification) proceeds exactly as it would normally.
    /// The block is applied later by <see cref="MarkBlocked"/> at the point of confirmation.
    /// </summary>
    public Result FlagBlocked(string reason)
    {
        if (Status != OrderStatus.Pending)
            return Result.Failure(OrderingErrors.InvalidStatusTransition);

        if (string.IsNullOrWhiteSpace(reason))
            return Result.Failure(OrderingErrors.BlockReasonRequired);

        BlockReason = reason;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    /// <summary>
    /// Parks a flagged order for merchant review instead of confirming it. Deliberately raises no
    /// domain events: stock stays unreserved and no Purchase is tracked until the merchant releases it.
    /// </summary>
    public Result MarkBlocked(string changedBy)
    {
        if (Status != OrderStatus.Pending)
            return Result.Failure(OrderingErrors.InvalidStatusTransition);

        if (string.IsNullOrWhiteSpace(BlockReason))
            return Result.Failure(OrderingErrors.OrderNotFlaggedBlocked);

        if (!_items.Any())
            return Result.Failure(OrderingErrors.EmptyOrder);

        ChangeStatus(OrderStatus.Blocked, changedBy, BlockReason);
        return Result.Success();
    }

    /// <summary>
    /// Merchant approved a blocked order. Confirms it and raises the same events a normal
    /// confirmation would, so stock is reserved and the Purchase is tracked now rather than at placement.
    /// </summary>
    public Result ReleaseFromBlock(string changedBy)
    {
        if (Status != OrderStatus.Blocked)
            return Result.Failure(OrderingErrors.InvalidStatusTransition);

        if (!_items.Any())
            return Result.Failure(OrderingErrors.EmptyOrder);

        BlockReason = null;
        ChangeStatus(OrderStatus.Confirmed, changedBy);
        RaiseDomainEvent(new OrderConfirmedEvent(Id));

        var itemSnapshots = _items.Select(i => new OrderItemSnapshot(i.ProductId, i.Quantity)).ToList();
        RaiseDomainEvent(new OrderPlacedEvent(Id, StoreId, CustomerId, OrderNumber, itemSnapshots, Pricing.Total));

        return Result.Success();
    }

    /// <summary>
    /// Merchant rejected a blocked order. Cancels it without raising OrderCancelledEvent, because
    /// the order never reserved stock and there is nothing to restore.
    /// </summary>
    public Result RejectBlocked(string reason, string changedBy)
    {
        if (Status != OrderStatus.Blocked)
            return Result.Failure(OrderingErrors.InvalidStatusTransition);

        ChangeStatus(OrderStatus.Cancelled, changedBy, reason);
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

    /// <summary>
    /// Applies a promo-code discount to the order. Only allowed while the order is still Pending.
    /// <paramref name="discountAmount"/> is the monetary reduction already computed by the promo code.
    /// </summary>
    public Result ApplyDiscount(string code, Money discountAmount)
    {
        if (Status != OrderStatus.Pending)
            return Result.Failure(OrderingErrors.OrderAlreadyConfirmed);

        AppliedPromoCode = code;
        Pricing = OrderPricing.Calculate(_items, Pricing.DeliveryFee, discountAmount, TaxRate, PricesIncludeTax);
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public void AddMerchantNote(string note)
    {
        Notes.AddMerchantNote(note);
        UpdatedAt = DateTime.UtcNow;
    }

    private void ChangeStatus(OrderStatus newStatus, string changedBy, string? notes = null)
    {
        var statusChange = OrderStatusChange.Create(Status, newStatus, changedBy, notes);
        _statusHistory.Add(statusChange);
        Status = newStatus;
        UpdatedAt = DateTime.UtcNow;
    }

    private void RecalculatePricing()
    {
        Pricing = OrderPricing.Calculate(_items, Pricing.DeliveryFee, Pricing.DiscountAmount, TaxRate, PricesIncludeTax);
    }
}
