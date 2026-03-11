using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ordering.Queries.GetMyOrders;

public record GetMyOrdersQuery : IQuery<List<MyOrderDto>>;

public record MyOrderDto(
    Guid Id,
    string OrderNumber,
    string OrderDate,
    string Status,
    decimal TotalAmount,
    int ItemCount
);
