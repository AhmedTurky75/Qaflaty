using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Storefront.Aggregates.Cart;

public sealed class CartItem : Entity<Guid>
{
    public CartId CartId { get; private set; } // Parent cart this item belongs to
    public ProductId ProductId { get; private set; } // Product added to the cart
    public Guid? VariantId { get; private set; } // Chosen variant of the product; null when the product has no variants
    public int Quantity { get; private set; } // Number of units of this product/variant in the cart
    public DateTime AddedAt { get; private set; } // UTC timestamp when the item was first added
    public DateTime UpdatedAt { get; private set; } // UTC timestamp of the last quantity change

    private CartItem() : base(Guid.Empty) { }

    public static CartItem Create(CartId cartId, ProductId productId, int quantity, Guid? variantId = null)
    {
        return new CartItem
        {
            //Id = Guid.NewGuid(),
            CartId = cartId,
            ProductId = productId,
            VariantId = variantId,
            Quantity = quantity,
            AddedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public void UpdateQuantity(int quantity)
    {
        Quantity = quantity;
        UpdatedAt = DateTime.UtcNow;
    }

    public void IncrementQuantity(int amount)
    {
        Quantity += amount;
        UpdatedAt = DateTime.UtcNow;
    }
}
