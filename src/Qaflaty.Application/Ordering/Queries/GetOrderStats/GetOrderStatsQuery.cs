using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;

namespace Qaflaty.Application.Ordering.Queries.GetOrderStats;

public record GetOrderStatsQuery(Guid StoreId) : IQuery<OrderStatsDto>;
