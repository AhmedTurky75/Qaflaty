using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Models;
using Qaflaty.Application.Ordering.DTOs;

namespace Qaflaty.Application.Ordering.Queries.GetStoreCustomers;

public record GetStoreCustomersQuery(
    Guid StoreId,
    string? SearchTerm,
    int PageNumber = 1,
    int PageSize = 20
) : IQuery<PaginatedList<CustomerListDto>>;
