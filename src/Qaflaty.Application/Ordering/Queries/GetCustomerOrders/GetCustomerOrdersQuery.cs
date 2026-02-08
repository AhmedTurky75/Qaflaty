using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;

namespace Qaflaty.Application.Ordering.Queries.GetCustomerOrders;

public record GetCustomerOrdersQuery(Guid CustomerId) : IQuery<List<OrderListDto>>;
