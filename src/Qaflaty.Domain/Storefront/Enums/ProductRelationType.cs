namespace Qaflaty.Domain.Storefront.Enums;

/// <summary>
/// Discriminates the kind of merchant-curated product-to-product link stored in
/// <see cref="Aggregates.RelatedProduct.RelatedProductLink"/>. One typed, many-to-many
/// self-referencing shape backs "related", "cross-sell" and "upsell" recommendations so no
/// schema change is needed to add another relation type later.
/// </summary>
public enum ProductRelationType
{
    /// <summary>Generic "related products" link (legacy default, same as before this field existed).</summary>
    Related = 0,

    /// <summary>Complementary product suggested alongside the source product (e.g. case for a phone).</summary>
    CrossSell = 1,

    /// <summary>Higher-value alternative or upgrade of the source product.</summary>
    UpSell = 2,

    /// <summary>Lower-priced alternative offered to retain a customer who may abandon the purchase.</summary>
    DownSell = 3
}
