using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.RelatedProduct;

namespace Qaflaty.Domain.Storefront.Repositories;

public interface IRelatedProductRepository
{
    Task<IReadOnlyList<RelatedProductLink>> GetByProductIdAsync(ProductId productId, CancellationToken ct = default);
    Task AddAsync(RelatedProductLink link, CancellationToken ct = default);
    void RemoveRange(IEnumerable<RelatedProductLink> links);
}
