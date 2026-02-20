namespace Qaflaty.Application.Storefront.DTOs;

public record ActiveCartDto(
    Guid CartId,
    Guid? CustomerId,
    string? GuestId,
    string CustomerName,
    string CustomerEmail,
    List<ActiveCartItemDto> Items,
    int TotalItems,
    DateTime LastUpdated
);

public record ActiveCartItemDto(
    Guid ProductId,
    string ProductName,
    string? ProductImageUrl,
    Guid? VariantId,
    int Quantity,
    decimal UnitPrice
);
