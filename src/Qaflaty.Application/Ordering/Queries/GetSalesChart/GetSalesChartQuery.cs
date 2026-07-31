using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;

namespace Qaflaty.Application.Ordering.Queries.GetSalesChart;

public record GetSalesChartQuery(
    Guid StoreId,
    int Days = 7
) : IQuery<IReadOnlyList<SalesChartPointDto>>;
