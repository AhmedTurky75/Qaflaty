using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.Store.Events;

public sealed record StoreUpdatedEvent(
    StoreId StoreId
) : DomainEvent;
