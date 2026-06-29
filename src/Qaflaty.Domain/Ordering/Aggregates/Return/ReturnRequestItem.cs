using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.Domain.Ordering.Aggregates.Return;

public sealed class ReturnRequestItem : Entity<Guid>
{
    public ReturnRequestId ReturnRequestId { get; private set; } // Parent return request this item belongs to
    public ProductId ProductId { get; private set; } // Product being returned
    public string ProductName { get; private set; } = null!; // Snapshot of the product name from the original order
    public Money UnitPrice { get; private set; } = null!; // Snapshot of the unit price paid (basis for the refund)
    public int Quantity { get; private set; } // Number of units being returned (1..originally ordered quantity)

    public Money LineTotal => UnitPrice.Multiply(Quantity); // Computed refund for this line = unit price × returned quantity

    private ReturnRequestItem() : base(Guid.NewGuid()) { }

    internal static ReturnRequestItem Create(
        ReturnRequestId returnRequestId, ProductId productId, string productName, Money unitPrice, int quantity)
        => new()
        {
            Id = Guid.NewGuid(),
            ReturnRequestId = returnRequestId,
            ProductId = productId,
            ProductName = productName,
            UnitPrice = unitPrice,
            Quantity = quantity
        };
}
