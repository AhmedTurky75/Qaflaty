using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.PromoCode;

/// <summary>
/// An audit record of a single redemption of a <see cref="PromoCode"/> on an order. Used to enforce
/// per-customer usage limits and to report on promotion performance. <see cref="CustomerId"/> is the
/// Ordering customer (keyed by phone), so guests and logged-in shoppers are counted consistently.
/// </summary>
public sealed class PromoCodeRedemption : AggregateRoot<PromoCodeRedemptionId>
{
    public PromoCodeId PromoCodeId { get; private set; } // The promo code that was redeemed
    public StoreId StoreId { get; private set; } // Store the redemption happened in
    public OrderId OrderId { get; private set; } // Order the code was applied to
    public CustomerId CustomerId { get; private set; } // Customer who redeemed it (keyed by phone, counts guests and members alike)
    public string Code { get; private set; } = null!; // Snapshot of the code text at redemption time, e.g. "SUMMER20"
    public decimal DiscountAmount { get; private set; } // Actual money discounted by this redemption, e.g. 20.00
    public DateTime RedeemedAt { get; private set; } // UTC timestamp of the redemption

    private PromoCodeRedemption() : base(PromoCodeRedemptionId.Empty) { }

    public static PromoCodeRedemption Create(
        PromoCodeId promoCodeId,
        StoreId storeId,
        OrderId orderId,
        CustomerId customerId,
        string code,
        decimal discountAmount)
    {
        return new PromoCodeRedemption
        {
            Id = PromoCodeRedemptionId.New(),
            PromoCodeId = promoCodeId,
            StoreId = storeId,
            OrderId = orderId,
            CustomerId = customerId,
            Code = code,
            DiscountAmount = discountAmount,
            RedeemedAt = DateTime.UtcNow
        };
    }
}
