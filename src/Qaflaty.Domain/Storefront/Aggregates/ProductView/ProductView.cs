using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Storefront.Aggregates.ProductView;

/// <summary>
/// Append-only record of a product page view, used to power most-viewed,
/// trending, and recently-viewed recommendations.
/// </summary>
public sealed class ProductView : AggregateRoot<ProductViewId>
{
    public StoreId StoreId { get; private set; }
    public ProductId ProductId { get; private set; }
    public StoreCustomerId? CustomerId { get; private set; }
    public string? SessionId { get; private set; }
    public DateTime ViewedAt { get; private set; }

    private ProductView() : base(ProductViewId.Empty) { }

    public static ProductView Create(
        StoreId storeId, ProductId productId, StoreCustomerId? customerId, string? sessionId)
    {
        return new ProductView
        {
            Id = ProductViewId.New(),
            StoreId = storeId,
            ProductId = productId,
            CustomerId = customerId,
            SessionId = string.IsNullOrWhiteSpace(sessionId) ? null : sessionId,
            ViewedAt = DateTime.UtcNow
        };
    }
}
