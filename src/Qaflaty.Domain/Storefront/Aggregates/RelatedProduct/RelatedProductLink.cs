using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Storefront.Enums;

namespace Qaflaty.Domain.Storefront.Aggregates.RelatedProduct;

/// <summary>
/// A merchant-curated link from a product to another product. <see cref="RelationType"/>
/// discriminates whether it is shown as "related" (manual related-products mode), a cross-sell
/// complement, or an upsell alternative — one typed, many-to-many self-referencing shape backs
/// all three so no schema change is needed to add another relation type later.
/// </summary>
public sealed class RelatedProductLink : Entity<Guid>
{
    public StoreId StoreId { get; private set; } // Store the link belongs to
    public ProductId ProductId { get; private set; } // The source product whose page shows the related items
    public ProductId RelatedProductId { get; private set; } // The product to recommend alongside the source product
    public ProductRelationType RelationType { get; private set; } // Related / CrossSell / UpSell / DownSell
    public int SortOrder { get; private set; } // Display order of this related product (lower = first)
    public bool IsEnabled { get; private set; } // Merchant can temporarily disable a link without deleting it

    private RelatedProductLink() : base(Guid.Empty) { }

    public static RelatedProductLink Create(
        StoreId storeId,
        ProductId productId,
        ProductId relatedProductId,
        int sortOrder,
        ProductRelationType relationType = ProductRelationType.Related)
    {
        return new RelatedProductLink
        {
            Id = Guid.NewGuid(),
            StoreId = storeId,
            ProductId = productId,
            RelatedProductId = relatedProductId,
            RelationType = relationType,
            SortOrder = sortOrder,
            IsEnabled = true
        };
    }

    public void UpdateSortOrder(int sortOrder) => SortOrder = sortOrder;

    public void Enable() => IsEnabled = true;

    public void Disable() => IsEnabled = false;
}
