namespace Qaflaty.Application.Ordering.DTOs;

// --- Shared primitive ---
public record MoneyDto(decimal Amount, string Currency);

// --- Order items ---
public record OrderItemDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    MoneyDto UnitPrice,
    int Quantity,
    MoneyDto Total
);

// --- Status history ---
public record OrderStatusChangeDto(
    Guid Id,
    string FromStatus,
    string ToStatus,
    DateTime ChangedAt,
    string? ChangedBy,
    string? Notes
);

// --- Nested sub-objects ---
public record OrderPricingDto(
    MoneyDto Subtotal,
    MoneyDto DeliveryFee,
    MoneyDto Total,
    MoneyDto? DiscountAmount = null
);

public record PaymentInfoDto(
    string Method,
    string Status,
    string? TransactionId,
    DateTime? PaidAt,
    string? FailureReason
);

public record AddressDto(
    string Street,
    string City,
    string? District,
    string? PostalCode,
    string Country,
    string? AdditionalInfo
);

public record DeliveryInfoDto(
    AddressDto Address,
    string? Instructions
);

public record OrderNotesDto(
    string? CustomerNotes,
    string? MerchantNotes
);

// --- Customer snapshot (data as captured at order placement) ---
public record CustomerSnapshotDto(
    string FullName,
    string Phone,
    string? Email
);

// --- Full order DTO (merchant view) ---
public record OrderDto(
    Guid Id,
    Guid StoreId,
    Guid CustomerId,
    string OrderNumber,
    string Status,
    CustomerSnapshotDto Customer,
    List<OrderItemDto> Items,
    OrderPricingDto Pricing,
    PaymentInfoDto Payment,
    DeliveryInfoDto Delivery,
    OrderNotesDto Notes,
    List<OrderStatusChangeDto> StatusHistory,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string Source,
    string? AppliedPromoCode = null
);

// --- Order list item (compact, for list views) ---
public record OrderListDto(
    Guid Id,
    string OrderNumber,
    string Status,
    string CustomerName,
    string CustomerPhone,
    decimal Total,
    int ItemCount,
    string PaymentMethod,
    string PaymentStatus,
    DateTime CreatedAt,
    string Source
);

// --- Track order (public, no auth) ---
public record TrackOrderItemDto(
    string ProductName,
    MoneyDto UnitPrice,
    int Quantity,
    MoneyDto Total
);

public record TrackOrderDeliveryDto(
    string Address,
    string? Instructions
);

public record TrackOrderPaymentDto(
    string Method,
    string Status
);

public record OrderTrackingDto(
    string OrderNumber,
    string Status,
    List<TrackOrderItemDto> Items,
    OrderPricingDto Pricing,
    TrackOrderDeliveryDto Delivery,
    TrackOrderPaymentDto Payment,
    List<OrderStatusChangeDto> StatusHistory,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

// --- Order calculation (pre-placement preview) ---
public record CalculateOrderDto(
    bool IsDeliveryAvailable,
    MoneyDto Subtotal,
    MoneyDto DeliveryFee,
    MoneyDto PaymentAdjustment,
    string? PaymentAdjustmentLabel,
    MoneyDto Total
);

// --- Stats ---
public record OrderStatsDto(
    int TotalOrders,
    int PendingOrders,
    int ConfirmedOrders,
    int ProcessingOrders,
    int ShippedOrders,
    int DeliveredOrders,
    int CancelledOrders,
    decimal TotalRevenue,
    decimal AverageOrderValue
);
