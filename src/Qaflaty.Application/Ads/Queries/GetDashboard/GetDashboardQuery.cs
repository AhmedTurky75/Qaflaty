using Qaflaty.Application.Ads.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ads.Queries.GetDashboard;

public record GetDashboardQuery(Guid StoreId) : IQuery<AdsDashboardDto>;
