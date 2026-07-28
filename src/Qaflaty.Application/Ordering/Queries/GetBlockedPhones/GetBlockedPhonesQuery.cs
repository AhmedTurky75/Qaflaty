using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Models;
using Qaflaty.Application.Ordering.DTOs;

namespace Qaflaty.Application.Ordering.Queries.GetBlockedPhones;

public record GetBlockedPhonesQuery(
    Guid StoreId,
    string? Search = null,
    int PageNumber = 1,
    int PageSize = 20) : IQuery<PaginatedList<BlockedPhoneDto>>;
