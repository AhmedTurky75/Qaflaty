using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.Product.Events;

public sealed record ProductStockChangedEvent(
    ProductId ProductId,
    int OldQuantity,
    int NewQuantity
) : DomainEvent;
