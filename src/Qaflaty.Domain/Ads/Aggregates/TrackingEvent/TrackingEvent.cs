using Qaflaty.Domain.Ads.Aggregates.TrackingEvent.Events;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Ads.Errors;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Ads.Aggregates.TrackingEvent;

/// <summary>
/// A single logical tracking occurrence (e.g. "this order's Purchase") captured once and
/// fanned out to every enabled provider. <see cref="EventKey"/> is the shared dedup key
/// (Meta/TikTok "event_id") used to merge the browser and server deliveries of the same
/// occurrence at the provider.
/// </summary>
public sealed class TrackingEvent : AggregateRoot<TrackingEventId>
{
    public StoreId StoreId { get; private set; } // Owning store (tenant) this event was captured for
    public Guid EventKey { get; private set; } // Shared dedup key sent to providers as event_id; identical for the browser and server delivery of the same occurrence
    public TrackingEventType EventType { get; private set; } // Standard event being tracked (ViewContent, Purchase, ...)
    public TrackingChannel Channel { get; private set; } // Whether this row represents the browser-side or server-side delivery
    public OrderId? OrderId { get; private set; } // Associated order, when this event is order-scoped (Purchase, InitiateCheckout with cart tied to a draft order, ...)
    public string? CustomerRef { get; private set; } // Session/customer identifier used to group events on the timeline
    public string PayloadJson { get; private set; } = string.Empty; // Normalized event payload snapshot (value, currency, content ids, ...) sent to providers
    public Guid CorrelationId { get; private set; } // Ties together the browser + server TrackingEvent rows of one logical occurrence for the Event Timeline
    public DateTime CreatedAt { get; private set; }

    private readonly List<TrackingDispatchLog> _dispatchLogs = [];
    public IReadOnlyList<TrackingDispatchLog> DispatchLogs => _dispatchLogs.AsReadOnly(); // One dispatch attempt history per provider this event was fanned out to

    private TrackingEvent() : base(TrackingEventId.Empty) { }

    public static Result<TrackingEvent> Create(
        StoreId storeId,
        Guid eventKey,
        TrackingEventType eventType,
        TrackingChannel channel,
        string payloadJson,
        Guid correlationId,
        OrderId? orderId = null,
        string? customerRef = null)
    {
        if (eventKey == Guid.Empty)
            return Result.Failure<TrackingEvent>(new Error("TrackingEvent.EventKeyRequired", "A dedup event key is required"));

        var trackingEvent = new TrackingEvent
        {
            Id = TrackingEventId.New(),
            StoreId = storeId,
            EventKey = eventKey,
            EventType = eventType,
            Channel = channel,
            OrderId = orderId,
            CustomerRef = customerRef,
            PayloadJson = payloadJson,
            CorrelationId = correlationId,
            CreatedAt = DateTime.UtcNow
        };

        trackingEvent.RaiseDomainEvent(new TrackingEventQueuedEvent(trackingEvent.Id, storeId, eventType, channel));

        return Result.Success(trackingEvent);
    }

    public TrackingDispatchLog QueueDispatch(AdProvider provider)
    {
        var log = TrackingDispatchLog.Create(provider);
        _dispatchLogs.Add(log);
        return log;
    }

    public Result<TrackingDispatchLog> ReplayDispatch(Guid dispatchLogId)
    {
        var log = _dispatchLogs.FirstOrDefault(l => l.Id == dispatchLogId);
        if (log == null)
            return Result.Failure<TrackingDispatchLog>(AdsErrors.DispatchLogNotFound);

        log.Replay();
        return Result.Success(log);
    }
}
