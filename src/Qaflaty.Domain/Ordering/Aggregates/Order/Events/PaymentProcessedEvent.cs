using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.Domain.Ordering.Aggregates.Order.Events;

public sealed record PaymentProcessedEvent(
    OrderId OrderId,
    string TransactionId,
    Money Amount
) : DomainEvent;
