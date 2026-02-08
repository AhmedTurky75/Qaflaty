using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.Product.Events;

public sealed record ProductCreatedEvent(
    ProductId ProductId,
    StoreId StoreId
) : DomainEvent;
