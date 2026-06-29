using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Storefront.Aggregates.RelatedProduct;

/// <summary>
/// A merchant-curated link from a product to another product that should be
/// shown as "related" when the store uses manual related-products mode.
/// </summary>
public sealed class RelatedProductLink : Entity<Guid>
{
    public StoreId StoreId { get; private set; } // Store the link belongs to
    public ProductId ProductId { get; private set; } // The source product whose page shows the related items
    public ProductId RelatedProductId { get; private set; } // The product to recommend alongside the source product
    public int SortOrder { get; private set; } // Display order of this related product (lower = first)

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
