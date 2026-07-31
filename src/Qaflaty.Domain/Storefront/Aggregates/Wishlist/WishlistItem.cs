using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Storefront.Aggregates.Wishlist;

public sealed class WishlistItem : Entity<Guid>
{
    public WishlistId WishlistId { get; private set; } // Parent wishlist this item belongs to
    public ProductId ProductId { get; private set; } // Saved product
    public Guid? VariantId { get; private set; } // Specific saved variant; null when the product has no variants
    public DateTime AddedAt { get; private set; } // UTC timestamp when the product was added to the wishlist

    private WishlistItem() : base(Guid.Empty) { }

    public static WishlistItem Create(WishlistId wishlistId, ProductId productId, Guid? variantId = null)
    {
        return new WishlistItem
        {
            Id = Guid.NewGuid(),
            WishlistId = wishlistId,
            ProductId = productId,
            VariantId = variantId,
            AddedAt = DateTime.UtcNow
        };
    }
}
