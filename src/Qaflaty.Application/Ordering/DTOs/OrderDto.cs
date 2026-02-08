namespace Qaflaty.Application.Ordering.DTOs;

public record OrderDto(
    Guid Id,
    Guid StoreId,
    Guid CustomerId,
    string OrderNumber,
    string Status,
    decimal Subtotal,
    decimal DeliveryFee,
    decimal Total,
    string PaymentMethod,
    string PaymentStatus,
    string? TransactionId,
    DateTime? PaidAt,
    string Street,
    string City,
    string? District,
    string? PostalCode,
    string Country,
    string? DeliveryInstructions,
    string? CustomerNotes,
    string? MerchantNotes,
    List<OrderItemDto> Items,
    List<OrderStatusChangeDto> StatusHistory,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

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
    DateTime CreatedAt
);

public record OrderTrackingDto(
    string OrderNumber,
    string Status,
    decimal Total,
    string PaymentMethod,
    string PaymentStatus,
    List<OrderStatusChangeDto> StatusHistory,
    DateTime CreatedAt
);

public record OrderItemDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    decimal UnitPrice,
    int Quantity,
    decimal Total
);

public record OrderStatusChangeDto(
    string FromStatus,
    string ToStatus,
    DateTime ChangedAt,
    string? Notes
);

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
