using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Storefront.Aggregates.Cart;

public sealed class CartItem : Entity<Guid>
{
    public CartId CartId { get; private set; }
    public ProductId ProductId { get; private set; }
    public Guid? VariantId { get; private set; }
    public int Quantity { get; private set; }
    public DateTime AddedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private CartItem() : base(Guid.Empty) { }

    public static CartItem Create(CartId cartId, ProductId productId, int quantity, Guid? variantId = null)
    {
        return new CartItem
        {
            Id = Guid.NewGuid(),
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
