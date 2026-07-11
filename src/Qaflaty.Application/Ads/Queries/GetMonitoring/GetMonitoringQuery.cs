using Qaflaty.Application.Ads.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ads.Queries.GetMonitoring;

public record GetMonitoringQuery(Guid StoreId) : IQuery<MonitoringDto>;
