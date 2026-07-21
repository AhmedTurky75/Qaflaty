using Qaflaty.Application.Analytics.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Analytics.Queries.GetLiveMetrics;

public record GetLiveMetricsQuery(Guid StoreId) : IQuery<LiveMetricsDto>;
