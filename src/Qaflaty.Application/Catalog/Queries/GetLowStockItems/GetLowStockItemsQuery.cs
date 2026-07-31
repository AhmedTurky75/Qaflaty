using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetLowStockItems;

public record GetLowStockItemsQuery(
    Guid StoreId,
    int Threshold = 10
) : IQuery<IReadOnlyList<LowStockItemDto>>;
