using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetInventoryHistory;

public record GetInventoryHistoryQuery(
    ProductId ProductId,
    Guid? VariantId = null,
    int Skip = 0,
    int Take = 50
) : IQuery<List<InventoryMovementDto>>;
