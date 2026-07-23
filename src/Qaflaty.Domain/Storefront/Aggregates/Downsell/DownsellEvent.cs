using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Storefront.Enums;

namespace Qaflaty.Domain.Storefront.Aggregates.Downsell;

/// <summary>
/// Append-only analytics record of a single downsell interaction. Never mutated after creation —
/// this is a log, not a live-state entity. Powers merchant reporting on offer performance.
/// </summary>
public sealed class DownsellEvent : Entity<Guid>
{
    public StoreId StoreId { get; private set; } // Store the event occurred in
    public ProductId? ProductId { get; private set; } // Source product the offer was shown for, when known
    public DownsellEventType EventType { get; private set; } // impression / accept / dismiss / coupon_redeemed / converted
    public DownsellTriggerType? TriggerType { get; private set; } // Which trigger caused the offer to display, when known
    public string SessionKey { get; private set; } = string.Empty; // Customer id or guest session id the event is attributed to
    public DateTime OccurredAt { get; private set; } // UTC timestamp of the event

    private DownsellEvent() : base(Guid.Empty) { }

    public static DownsellEvent Create(
        StoreId storeId,
        ProductId? productId,
        DownsellEventType eventType,
        DownsellTriggerType? triggerType,
        string sessionKey)
    {
        return new DownsellEvent
        {
            Id = Guid.NewGuid(),
            StoreId = storeId,
            ProductId = productId,
            EventType = eventType,
            TriggerType = triggerType,
            SessionKey = sessionKey,
            OccurredAt = DateTime.UtcNow
        };
    }
}
