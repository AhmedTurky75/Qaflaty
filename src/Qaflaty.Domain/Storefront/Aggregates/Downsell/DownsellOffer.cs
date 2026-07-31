using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Storefront.Aggregates.Downsell;

/// <summary>
/// Per-product downsell configuration: an optional coupon incentive to show alongside (or instead
/// of) cheaper product alternatives when a customer views this product. The cheaper alternatives
/// themselves are <c>RelatedProductLink</c> rows with <c>RelationType.DownSell</c> — this entity
/// only carries the coupon + enable/disable, since a product can have at most one active offer.
/// </summary>
public sealed class DownsellOffer : Entity<Guid>
{
    public StoreId StoreId { get; private set; } // Store this offer belongs to
    public ProductId ProductId { get; private set; } // The source product this offer is shown for
    public PromoCodeId? PromoCodeId { get; private set; } // Optional coupon to advertise; null = product alternatives only
    public bool IsEnabled { get; private set; } // Merchant can turn the offer off without deleting it

    private DownsellOffer() : base(Guid.Empty) { }

    public static DownsellOffer Create(StoreId storeId, ProductId productId, PromoCodeId? promoCodeId, bool isEnabled)
    {
        return new DownsellOffer
        {
            Id = Guid.NewGuid(),
            StoreId = storeId,
            ProductId = productId,
            PromoCodeId = promoCodeId,
            IsEnabled = isEnabled
        };
    }

    public void Update(PromoCodeId? promoCodeId, bool isEnabled)
    {
        PromoCodeId = promoCodeId;
        IsEnabled = isEnabled;
    }
}
