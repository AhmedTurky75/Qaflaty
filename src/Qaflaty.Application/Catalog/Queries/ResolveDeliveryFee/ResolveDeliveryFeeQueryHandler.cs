using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.ResolveDeliveryFee;

public class ResolveDeliveryFeeQueryHandler : IQueryHandler<ResolveDeliveryFeeQuery, ResolvedDeliveryFeeDto>
{
    private readonly IDeliveryZoneRepository _zoneRepository;
    private readonly IStoreRepository _storeRepository;

    public ResolveDeliveryFeeQueryHandler(
        IDeliveryZoneRepository zoneRepository,
        IStoreRepository storeRepository)
    {
        _zoneRepository = zoneRepository;
        _storeRepository = storeRepository;
    }

    public async Task<Result<ResolvedDeliveryFeeDto>> Handle(
        ResolveDeliveryFeeQuery request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        // Check district zone first (most specific)
        if (request.DistrictId.HasValue)
        {
            var districtZone = await _zoneRepository.GetZoneAsync(
                storeId, DeliveryZoneLevel.District, request.DistrictId.Value, cancellationToken);

            if (districtZone != null)
            {
                if (!districtZone.IsDeliveryEnabled)
                    return Result.Success(new ResolvedDeliveryFeeDto(false, null, null, "District"));

                if (districtZone.CustomDeliveryFee.HasValue)
                    return Result.Success(new ResolvedDeliveryFeeDto(
                        true, districtZone.CustomDeliveryFee, districtZone.FeeCurrency, "District"));
            }
        }

        // Check city zone
        if (request.CityId.HasValue)
        {
            var cityZone = await _zoneRepository.GetZoneAsync(
                storeId, DeliveryZoneLevel.City, request.CityId.Value, cancellationToken);

            if (cityZone != null)
            {
                if (!cityZone.IsDeliveryEnabled)
                    return Result.Success(new ResolvedDeliveryFeeDto(false, null, null, "City"));

                if (cityZone.CustomDeliveryFee.HasValue)
                    return Result.Success(new ResolvedDeliveryFeeDto(
                        true, cityZone.CustomDeliveryFee, cityZone.FeeCurrency, "City"));
            }
        }

        // Check country zone
        var countryZone = await _zoneRepository.GetZoneAsync(
            storeId, DeliveryZoneLevel.Country, request.CountryId, cancellationToken);

        if (countryZone != null)
        {
            if (!countryZone.IsDeliveryEnabled)
                return Result.Success(new ResolvedDeliveryFeeDto(false, null, null, "Country"));

            if (countryZone.CustomDeliveryFee.HasValue)
                return Result.Success(new ResolvedDeliveryFeeDto(
                    true, countryZone.CustomDeliveryFee, countryZone.FeeCurrency, "Country"));
        }

        // Fall back to store default
        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null)
            return Result.Failure<ResolvedDeliveryFeeDto>(
                new Error("Store.NotFound", "Store not found"));

        return Result.Success(new ResolvedDeliveryFeeDto(
            true,
            store.DeliverySettings.DeliveryFee.Amount,
            store.DeliverySettings.DeliveryFee.Currency.ToString(),
            "StoreDefault"));
    }
}
