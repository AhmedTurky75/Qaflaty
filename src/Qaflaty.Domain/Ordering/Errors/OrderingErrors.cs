using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Domain.Ordering.Errors;

public static class OrderingErrors
{
    public static readonly Error OrderNotFound =
        new("Ordering.OrderNotFound", "Order not found");

    public static readonly Error InvalidStatusTransition =
        new("Ordering.InvalidStatusTransition", "Invalid order status transition");

    public static readonly Error OrderAlreadyConfirmed =
        new("Ordering.OrderAlreadyConfirmed", "Order is already confirmed and cannot be modified");

    public static readonly Error InsufficientStock =
        new("Ordering.InsufficientStock", "Insufficient stock for one or more items");

    public static readonly Error PaymentRequired =
        new("Ordering.PaymentRequired", "Payment is required before shipping");

    public static readonly Error PaymentFailed =
        new("Ordering.PaymentFailed", "Payment processing failed");

    public static readonly Error EmptyOrder =
        new("Ordering.EmptyOrder", "Order must have at least one item");

    public static readonly Error ItemNotFound =
        new("Ordering.ItemNotFound", "Order item not found");

    public static readonly Error InvalidQuantity =
        new("Ordering.InvalidQuantity", "Quantity must be greater than zero");

    public static readonly Error CustomerNotFound =
        new("Ordering.CustomerNotFound", "Customer not found");

    public static readonly Error InvalidAddress =
        new("Ordering.InvalidAddress", "Invalid address information");

    public static readonly Error InvalidOrderNumber =
        new("Ordering.InvalidOrderNumber", "Invalid order number format");
}
