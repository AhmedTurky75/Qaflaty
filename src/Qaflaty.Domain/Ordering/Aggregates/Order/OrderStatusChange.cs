using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Ordering.Enums;

namespace Qaflaty.Domain.Ordering.Aggregates.Order;

public sealed class OrderStatusChange : Entity<Guid>
{
    public OrderStatus FromStatus { get; private set; } // Status the order was in before this transition
    public OrderStatus ToStatus { get; private set; } // Status the order moved to
    public DateTime ChangedAt { get; private set; } // UTC timestamp of the transition
    public string? ChangedBy { get; private set; }  // Who triggered the change — a MerchantId or "System" for automatic transitions
    public string? Notes { get; private set; } // Optional note/reason for the change, e.g. cancellation reason

    private OrderStatusChange() : base(Guid.Empty) { }

    public static OrderStatusChange Create(
        OrderStatus fromStatus,
        OrderStatus toStatus,
        string? changedBy = null,
        string? notes = null)
    {
        return new OrderStatusChange
        {
            //Id = Guid.NewGuid(),
            FromStatus = fromStatus,
            ToStatus = toStatus,
            ChangedAt = DateTime.UtcNow,
            ChangedBy = changedBy,
            Notes = notes
        };
    }
}
