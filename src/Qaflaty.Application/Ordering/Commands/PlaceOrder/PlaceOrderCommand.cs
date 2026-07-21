using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Ordering.Enums;

namespace Qaflaty.Application.Ordering.Commands.PlaceOrder;

public record PlaceOrderItemDto(
    Guid ProductId,
    int Quantity,
    Guid? VariantId
);

public record PlaceOrderCommand(
    Guid StoreId,
    string CustomerName,
    string CustomerPhone,
    string CustomerPhoneCountryCode,
    string CustomerEmail,
    string Street,
    string City,
    string? District,
    string? Country,
    string? DeliveryInstructions,
    string? CustomerNotes,
    string PaymentMethod,
    List<PlaceOrderItemDto> Items,
    int CountryCode = 0,
    int? CityId = null,
    int? DistrictId = null,
    OrderSource Source = OrderSource.Storefront,
    string? PromoCode = null,
    // Storefront buyer identity (authenticated customer id, or guest session id) — used only to
    // locate and clear the cart that was checked out; unrelated to the phone-derived Ordering
    // Customer created above. Null for merchant-entered manual orders.
    Guid? BuyerCustomerId = null,
    string? BuyerGuestId = null
) : ICommand<OrderDto>;
