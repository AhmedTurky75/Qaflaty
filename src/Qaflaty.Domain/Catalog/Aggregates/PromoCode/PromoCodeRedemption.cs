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
    public PromoCodeId PromoCodeId { get; private set; }
    public StoreId StoreId { get; private set; }
    public OrderId OrderId { get; private set; }
    public CustomerId CustomerId { get; private set; }
    public string Code { get; private set; } = null!;
    public decimal DiscountAmount { get; private set; }
    public DateTime RedeemedAt { get; private set; }

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
