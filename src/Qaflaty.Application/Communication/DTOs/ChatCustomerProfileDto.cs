namespace Qaflaty.Application.Communication.DTOs;

public sealed record ChatCustomerProfileDto
{
    public Guid CustomerId { get; init; }
    public string FullName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? Phone { get; init; }
    public string? SecondaryPhone { get; init; }
    public bool IsVerified { get; init; }
    public DateTime MemberSince { get; init; }
    public List<ChatCustomerAddressDto> Addresses { get; init; } = new();
    public List<ChatCustomerOrderDto> RecentOrders { get; init; } = new();
    public List<ChatCartItemDto> CartItems { get; init; } = new();
}

public sealed record ChatCustomerAddressDto(
    string Label,
    string Street,
    string City,
    string Country,
    bool IsDefault);

public sealed record ChatCustomerOrderDto(
    string OrderNumber,
    string Status,
    decimal Total,
    int ItemCount,
    DateTime CreatedAt);

public sealed record ChatCartItemDto(
    Guid ProductId,
    int Quantity,
    Guid? VariantId);
