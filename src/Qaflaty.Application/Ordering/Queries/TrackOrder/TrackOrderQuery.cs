using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;

namespace Qaflaty.Application.Ordering.Queries.TrackOrder;

public record TrackOrderQuery(Guid StoreId, string OrderNumber) : IQuery<OrderTrackingDto>;
