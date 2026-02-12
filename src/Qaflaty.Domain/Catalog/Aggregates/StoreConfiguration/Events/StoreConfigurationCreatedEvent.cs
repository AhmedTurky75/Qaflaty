using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.StoreConfiguration.Events;

public sealed record StoreConfigurationCreatedEvent(
    StoreConfigurationId StoreConfigurationId,
    StoreId StoreId
) : DomainEvent;
