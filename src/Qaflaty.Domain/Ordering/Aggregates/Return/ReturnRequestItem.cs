using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.Domain.Ordering.Aggregates.Return;

public sealed class ReturnRequestItem : Entity<Guid>
{
    public ReturnRequestId ReturnRequestId { get; private set; }
    public ProductId ProductId { get; private set; }
    public string ProductName { get; private set; } = null!;
    public Money UnitPrice { get; private set; } = null!;
    public int Quantity { get; private set; }

    public Money LineTotal => UnitPrice.Multiply(Quantity);

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
