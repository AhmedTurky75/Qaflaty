using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Ordering.Aggregates.Order.Events;

public sealed record OrderCancelledEvent(
    OrderId OrderId,
    string Reason
) : DomainEvent;
