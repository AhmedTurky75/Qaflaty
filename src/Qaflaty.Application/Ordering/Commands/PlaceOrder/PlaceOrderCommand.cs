using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;

namespace Qaflaty.Application.Ordering.Commands.PlaceOrder;

public record PlaceOrderItemDto(
    Guid ProductId,
    string ProductName,
    decimal UnitPrice,
    int Quantity
);

public record PlaceOrderCommand(
    Guid StoreId,
    string CustomerName,
    string CustomerPhone,
    string? CustomerEmail,
    string Street,
    string City,
    string? District,
    string? PostalCode,
    string Country,
    string? DeliveryInstructions,
    string? CustomerNotes,
    string PaymentMethod,
    List<PlaceOrderItemDto> Items
) : ICommand<OrderDto>;
