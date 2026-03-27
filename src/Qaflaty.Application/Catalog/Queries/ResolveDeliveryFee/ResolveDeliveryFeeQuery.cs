using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.ResolveDeliveryFee;

/// <summary>
/// Resolves the effective delivery fee for a given store and destination address.
/// Returns whether delivery is available and the computed fee.
/// </summary>
public record ResolveDeliveryFeeQuery(
    Guid StoreId,
    int CountryId,
    int? CityId,
    int? DistrictId
) : IQuery<ResolvedDeliveryFeeDto>;
