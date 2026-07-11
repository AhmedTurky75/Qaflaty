using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Ads.Aggregates.TrackingEvent.Events;

public sealed record TrackingEventQueuedEvent(
    TrackingEventId TrackingEventId,
    StoreId StoreId,
    TrackingEventType EventType,
    TrackingChannel Channel) : DomainEvent;
