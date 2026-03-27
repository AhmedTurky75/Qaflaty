namespace Qaflaty.Api.Controllers.Requests;

public record PlaceOrderRequest(
    CustomerInfoRequest CustomerInfo,
    AddressRequest DeliveryAddress,
    string PaymentMethod,
    List<OrderItemRequest> Items,
    string? Notes
);

public record CustomerInfoRequest(
    string FullName,
    string Phone,
    string PhoneCountryCode,
    string Email
);

public record AddressRequest(
    string Street,
    string City,
    string? District,
    string? AdditionalInstructions,
    int CountryCode = 0,
    int? CityId = null,
    int? DistrictId = null
);

public record OrderItemRequest(
    Guid ProductId,
    int Quantity,
    Guid? VariantId
);

public record VerifyOtpRequest(string OtpCode);

public record GetProductsRequest(
    Guid? CategoryId,
    int PageNumber = 1,
    int PageSize = 20
);
