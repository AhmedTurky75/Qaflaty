using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Ordering.Queries.GetStoreReturns;

public record GetStoreReturnsQuery(StoreId StoreId, string? Status) : IQuery<IReadOnlyList<ReturnRequestDto>>;
