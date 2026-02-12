using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Storefront.Aggregates.Wishlist;

public sealed class WishlistItem : Entity<Guid>
{
    public WishlistId WishlistId { get; private set; }
    public ProductId ProductId { get; private set; }
    public Guid? VariantId { get; private set; }
    public DateTime AddedAt { get; private set; }

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
