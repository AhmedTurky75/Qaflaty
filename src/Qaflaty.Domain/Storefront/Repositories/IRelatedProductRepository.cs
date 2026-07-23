using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.RelatedProduct;
using Qaflaty.Domain.Storefront.Enums;

namespace Qaflaty.Domain.Storefront.Repositories;

public interface IRelatedProductRepository
{
    Task<IReadOnlyList<RelatedProductLink>> GetByProductIdAsync(
        ProductId productId, ProductRelationType? relationType = null, CancellationToken ct = default);

    /// <summary>Batch-loads links for many source products in one query (used by cart-level recommendations).</summary>
    Task<IReadOnlyList<RelatedProductLink>> GetByProductIdsAsync(
        IReadOnlyCollection<ProductId> productIds, ProductRelationType relationType, CancellationToken ct = default);

    Task AddAsync(RelatedProductLink link, CancellationToken ct = default);
    void RemoveRange(IEnumerable<RelatedProductLink> links);
}
