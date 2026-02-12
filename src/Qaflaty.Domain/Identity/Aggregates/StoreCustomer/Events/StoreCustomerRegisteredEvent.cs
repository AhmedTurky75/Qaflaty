using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.Domain.Identity.Aggregates.StoreCustomer.Events;

public sealed record StoreCustomerRegisteredEvent(
    StoreCustomerId StoreCustomerId,
    Email Email
) : DomainEvent;
