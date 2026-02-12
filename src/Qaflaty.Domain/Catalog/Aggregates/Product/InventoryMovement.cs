using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.Product;

/// <summary>
/// Tracks all inventory changes for audit and reporting purposes
/// </summary>
public sealed class InventoryMovement : Entity<Guid>
{
    public ProductId ProductId { get; private set; }
    public Guid? VariantId { get; private set; }

    /// <summary>
    /// The change in quantity (positive for additions, negative for removals)
    /// </summary>
    public int QuantityChange { get; private set; }

    /// <summary>
    /// Quantity after this movement
    /// </summary>
    public int QuantityAfter { get; private set; }

    public InventoryMovementType Type { get; private set; }
    public string Reason { get; private set; } = string.Empty;

    /// <summary>
    /// Reference to related order if this movement was due to an order
    /// </summary>
    public OrderId? OrderId { get; private set; }

    public DateTime CreatedAt { get; private set; }

    private InventoryMovement() : base(Guid.Empty) { }

    public static InventoryMovement Create(
        ProductId productId,
        Guid? variantId,
        int quantityChange,
        int quantityAfter,
        InventoryMovementType type,
        string reason,
        OrderId? orderId = null)
    {
        return new InventoryMovement
        {
            Id = Guid.NewGuid(),
            ProductId = productId,
            VariantId = variantId,
            QuantityChange = quantityChange,
            QuantityAfter = quantityAfter,
            Type = type,
            Reason = reason,
            OrderId = orderId,
            CreatedAt = DateTime.UtcNow
        };
    }
}

public enum InventoryMovementType
{
    Initial = 0,        // Initial stock setup
    Purchase = 1,       // Stock added via purchase/restock
    Sale = 2,           // Stock reduced via sale
    Adjustment = 3,     // Manual adjustment (positive or negative)
    Return = 4,         // Stock returned from customer
    Damage = 5,         // Stock damaged/written off
    Transfer = 6        // Stock transferred between variants
}
