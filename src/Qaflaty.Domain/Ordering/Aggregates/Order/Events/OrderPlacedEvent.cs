using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Ordering.ValueObjects;

namespace Qaflaty.Domain.Ordering.Aggregates.Order.Events;

public sealed record OrderPlacedEvent(
    OrderId OrderId,
    StoreId StoreId,
    CustomerId CustomerId,
    OrderNumber OrderNumber,
    IReadOnlyList<OrderItemSnapshot> Items,
    Money Total
) : DomainEvent;

public record OrderItemSnapshot(ProductId ProductId, int Quantity);
