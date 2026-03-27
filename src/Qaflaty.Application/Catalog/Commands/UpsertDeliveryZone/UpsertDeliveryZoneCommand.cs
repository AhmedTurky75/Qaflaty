using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.UpsertDeliveryZone;

/// <summary>
/// Creates or updates a delivery zone for a specific geographic location within a store.
/// </summary>
public record UpsertDeliveryZoneCommand(
    Guid StoreId,
    string Level,          // "Country", "City", or "District"
    int ReferenceId,       // country_id / city_id / district_id
    bool IsDeliveryEnabled,
    decimal? CustomDeliveryFee,
    string? FeeCurrency
) : ICommand<DeliveryZoneDto>;
