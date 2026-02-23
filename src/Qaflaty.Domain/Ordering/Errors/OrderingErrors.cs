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

    public static readonly Error EmailRequired =
        new("Ordering.EmailRequired", "Email is required to confirm your order");

    public static readonly Error OtpNotFound =
        new("Ordering.OtpNotFound", "No active verification code found. Please request a new one");

    public static readonly Error OtpExpired =
        new("Ordering.OtpExpired", "Verification code has expired. Please request a new one");

    public static readonly Error OtpMaxAttemptsReached =
        new("Ordering.OtpMaxAttemptsReached", "Maximum attempts reached. Please request a new verification code");

    public static readonly Error OtpInvalid =
        new("Ordering.OtpInvalid", "Invalid verification code");

    public static readonly Error OtpResendTooSoon =
        new("Ordering.OtpResendTooSoon", "Please wait 60 seconds before requesting a new code");

    public static readonly Error OrderNotPending =
        new("Ordering.OrderNotPending", "Order is not in pending status");
}
