using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.Domain.Catalog.Aggregates.Product.Events;

public sealed record ProductPriceChangedEvent(
    ProductId ProductId,
    Money OldPrice,
    Money NewPrice
) : DomainEvent;
