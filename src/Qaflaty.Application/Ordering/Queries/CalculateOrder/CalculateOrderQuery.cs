using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;

namespace Qaflaty.Application.Ordering.Queries.CalculateOrder;

public record CalculateOrderItemDto(
    Guid ProductId,
    int Quantity,
    Guid? VariantId
);

public record CalculateOrderQuery(
    Guid StoreId,
    int CountryCode,
    int? CityId,
    int? DistrictId,
    List<CalculateOrderItemDto> Items
) : IQuery<CalculateOrderDto>;
