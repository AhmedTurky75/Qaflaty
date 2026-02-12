using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Identity.Aggregates.StoreCustomer.Events;

public sealed record CustomerPasswordChangedEvent(
    StoreCustomerId StoreCustomerId
) : DomainEvent;
