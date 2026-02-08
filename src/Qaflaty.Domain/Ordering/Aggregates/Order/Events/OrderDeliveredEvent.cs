using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Ordering.Aggregates.Order.Events;

public sealed record OrderDeliveredEvent(
    OrderId OrderId
) : DomainEvent;
