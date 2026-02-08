using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Ordering.Enums;

namespace Qaflaty.Domain.Ordering.Aggregates.Order;

public sealed class OrderStatusChange : Entity<Guid>
{
    public OrderStatus FromStatus { get; private set; }
    public OrderStatus ToStatus { get; private set; }
    public DateTime ChangedAt { get; private set; }
    public string? ChangedBy { get; private set; }  // MerchantId or "System"
    public string? Notes { get; private set; }

    private OrderStatusChange() : base(Guid.Empty) { }

    public static OrderStatusChange Create(
        OrderStatus fromStatus,
        OrderStatus toStatus,
        string? changedBy = null,
        string? notes = null)
    {
        return new OrderStatusChange
        {
            Id = Guid.NewGuid(),
            FromStatus = fromStatus,
            ToStatus = toStatus,
            ChangedAt = DateTime.UtcNow,
            ChangedBy = changedBy,
            Notes = notes
        };
    }
}
