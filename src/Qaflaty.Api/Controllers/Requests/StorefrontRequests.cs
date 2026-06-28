namespace Qaflaty.Api.Controllers.Requests;

public record PlaceOrderRequest(
    CustomerInfoRequest CustomerInfo,
    AddressRequest DeliveryAddress,
    string PaymentMethod,
    List<OrderItemRequest> Items,
    string? Notes,
    string? PromoCode = null
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

public record CalculateOrderRequest(
    List<OrderItemRequest> Items,
    int CountryCode = 0,
    int? CityId = null,
    int? DistrictId = null,
    string? PaymentMethod = null
);

public record GetProductsRequest(
    Guid? CategoryId,
    string? Search = null,
    string? SortBy = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    int PageNumber = 1,
    int PageSize = 20,
    // "definitionId:value" pairs, e.g. "3fa85f64-...:Cotton"
    [Microsoft.AspNetCore.Mvc.FromQuery(Name = "propertyFilters")] List<string>? PropertyFilters = null
);
