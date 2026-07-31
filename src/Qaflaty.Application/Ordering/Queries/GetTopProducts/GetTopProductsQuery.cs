using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;

namespace Qaflaty.Application.Ordering.Queries.GetTopProducts;

public record GetTopProductsQuery(
    Guid StoreId,
    int Limit = 5
) : IQuery<IReadOnlyList<TopProductDto>>;
