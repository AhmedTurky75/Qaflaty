namespace Qaflaty.Domain.Ordering.Enums;

public enum OrderStatus
{
    Pending = 1,
    Confirmed = 2,
    Processing = 3,
    Shipped = 4,
    Delivered = 5,
    Cancelled = 6,

    /// <summary>
    /// The order came from a phone number the merchant has blocked. It is parked for review instead
    /// of being confirmed: no stock was reserved, no purchase was tracked, and no promo redemption
    /// was recorded. Terminal until the merchant releases it (→ Confirmed) or rejects it (→ Cancelled).
    /// </summary>
    Blocked = 7
}
