using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.Product;

/// <summary>
/// Tracks all inventory changes for audit and reporting purposes
/// </summary>
public sealed class InventoryMovement : Entity<Guid>
{
    public ProductId ProductId { get; private set; } // Product whose stock changed
    public Guid? VariantId { get; private set; } // Specific variant affected, or null when the movement is on the base product

    /// <summary>
    /// The change in quantity (positive for additions, negative for removals)
    /// </summary>
    public int QuantityChange { get; private set; } // Signed delta applied, e.g. -1 for a sale, +50 for a restock

    /// <summary>
    /// Quantity after this movement
    /// </summary>
    public int QuantityAfter { get; private set; } // Resulting on-hand quantity right after this movement (running balance)

    public InventoryMovementType Type { get; private set; } // Reason category: Initial / Purchase / Sale / Adjustment / Return / Damage / Transfer
    public string Reason { get; private set; } = string.Empty; // Free-text note explaining the movement, e.g. "Stock reserved for order"

    /// <summary>
    /// Reference to related order if this movement was due to an order
    /// </summary>
    public OrderId? OrderId { get; private set; } // Order that triggered the movement, when applicable (e.g. a sale)

    public DateTime CreatedAt { get; private set; } // UTC timestamp when the movement was recorded

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
