namespace Qaflaty.Application.Catalog.DTOs;

public record DeliveryZoneDto(
    Guid Id,
    Guid StoreId,
    string Level,
    int ReferenceId,
    bool IsDeliveryEnabled,
    decimal? CustomDeliveryFee,
    string? FeeCurrency);

public record ResolvedDeliveryFeeDto(
    bool IsDeliveryAvailable,
    decimal? Fee,
    string? Currency,
    string ResolvedAtLevel);
