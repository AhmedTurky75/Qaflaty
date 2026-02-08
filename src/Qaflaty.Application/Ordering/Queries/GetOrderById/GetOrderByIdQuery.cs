using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;

namespace Qaflaty.Application.Ordering.Queries.GetOrderById;

public record GetOrderByIdQuery(Guid OrderId) : IQuery<OrderDto>;
