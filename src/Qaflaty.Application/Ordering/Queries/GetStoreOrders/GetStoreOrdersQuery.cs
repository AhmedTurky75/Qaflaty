using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Models;
using Qaflaty.Application.Ordering.DTOs;

namespace Qaflaty.Application.Ordering.Queries.GetStoreOrders;

public record GetStoreOrdersQuery(
    Guid StoreId,
    string? Status,
    string? SearchTerm,
    int PageNumber = 1,
    int PageSize = 20
) : IQuery<PaginatedList<OrderListDto>>;
