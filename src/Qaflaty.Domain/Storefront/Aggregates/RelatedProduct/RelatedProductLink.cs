using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Storefront.Aggregates.RelatedProduct;

/// <summary>
/// A merchant-curated link from a product to another product that should be
/// shown as "related" when the store uses manual related-products mode.
/// </summary>
public sealed class RelatedProductLink : Entity<Guid>
{
    public StoreId StoreId { get; private set; }
    public ProductId ProductId { get; private set; }
    public ProductId RelatedProductId { get; private set; }
    public int SortOrder { get; private set; }

    private RelatedProductLink() : base(Guid.Empty) { }

    public static RelatedProductLink Create(
        StoreId storeId, ProductId productId, ProductId relatedProductId, int sortOrder)
    {
        return new RelatedProductLink
        {
            Id = Guid.NewGuid(),
            StoreId = storeId,
            ProductId = productId,
            RelatedProductId = relatedProductId,
            SortOrder = sortOrder
        };
    }
}
