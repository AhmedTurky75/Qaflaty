using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetDeliveryZones;

public record GetDeliveryZonesQuery(Guid StoreId) : IQuery<List<DeliveryZoneDto>>;
