using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Ordering.Errors;

namespace Qaflaty.Domain.Ordering.Aggregates.Order;

public sealed class OrderItem : Entity<OrderItemId>
{
    public ProductId ProductId { get; private set; } // Product purchased in this line
    public string ProductName { get; private set; } = null!;  // Snapshot of the product name at order time (so later renames don't change history), e.g. "Blue T-Shirt"
    public Money UnitPrice { get; private set; } = null!;      // Snapshot of the price per unit at order time (immutable record of what was charged)
    public int Quantity { get; private set; } // Number of units ordered (must be > 0)

    public Money Total => UnitPrice * Quantity; // Computed line total = unit price × quantity

    private OrderItem() : base(OrderItemId.Empty) { }

    public static Result<OrderItem> Create(ProductId productId, string productName, Money unitPrice, int quantity)
    {
        if (quantity <= 0)
            return Result.Failure<OrderItem>(OrderingErrors.InvalidQuantity);

        return Result.Success(new OrderItem
        {
            Id = OrderItemId.New(),
            ProductId = productId,
            ProductName = productName,
            UnitPrice = unitPrice,
            Quantity = quantity
        });
    }

    public Result UpdateQuantity(int newQuantity)
    {
        if (newQuantity <= 0)
            return Result.Failure(OrderingErrors.InvalidQuantity);

        Quantity = newQuantity;
        return Result.Success();
    }
}
