using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Storefront.Enums;

namespace Qaflaty.Domain.Storefront.Aggregates.Downsell;

/// <summary>
/// A store-scoped, merchant-configurable behavioral rule describing when a downsell offer may be
/// considered. Multiple rules may be enabled simultaneously. Evaluation of what a rule's threshold
/// means (seconds of dwell/inactivity) is owned by the client detector and the server's
/// EvaluateDownsell handler — this entity is purely configuration data.
/// </summary>
public sealed class DownsellTriggerRule : Entity<Guid>
{
    public StoreId StoreId { get; private set; } // Store this rule belongs to
    public DownsellTriggerType TriggerType { get; private set; } // Which behavioral signal this rule configures
    public DownsellSurface Surface { get; private set; } // Product Details or Cart
    public int? ThresholdSeconds { get; private set; } // Seconds of dwell/inactivity required; null for signals with no duration (e.g. exit intent, cart item removed)
    public bool IsEnabled { get; private set; } // Whether this trigger currently fires
    public int Priority { get; private set; } // Display/evaluation order when multiple rules could fire at once (lower = first)

    private DownsellTriggerRule() : base(Guid.Empty) { }

    public static DownsellTriggerRule Create(
        StoreId storeId,
        DownsellTriggerType triggerType,
        DownsellSurface surface,
        int? thresholdSeconds,
        bool isEnabled,
        int priority)
    {
        return new DownsellTriggerRule
        {
            Id = Guid.NewGuid(),
            StoreId = storeId,
            TriggerType = triggerType,
            Surface = surface,
            ThresholdSeconds = thresholdSeconds,
            IsEnabled = isEnabled,
            Priority = priority
        };
    }

    public void Update(int? thresholdSeconds, bool isEnabled, int priority)
    {
        ThresholdSeconds = thresholdSeconds;
        IsEnabled = isEnabled;
        Priority = priority;
    }
}
