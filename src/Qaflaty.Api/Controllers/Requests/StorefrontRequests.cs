namespace Qaflaty.Api.Controllers.Requests;

public record PlaceOrderRequest(
    string CustomerName,
    string CustomerPhone,
    string? CustomerEmail,
    AddressRequest DeliveryAddress,
    string? DeliveryInstructions,
    string? CustomerNotes,
    string PaymentMethod,
    List<OrderItemRequest> Items
);

public record AddressRequest(
    string Street,
    string City,
    string? District,
    string? PostalCode,
    string Country
);

public record OrderItemRequest(
    Guid ProductId,
    string ProductName,
    decimal UnitPrice,
    int Quantity
);

public record VerifyOtpRequest(string OtpCode);

public record GetProductsRequest(
    Guid? CategoryId,
    int PageNumber = 1,
    int PageSize = 20
);
