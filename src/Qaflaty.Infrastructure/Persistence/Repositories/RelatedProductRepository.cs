using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.RelatedProduct;
using Qaflaty.Domain.Storefront.Enums;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class RelatedProductRepository : IRelatedProductRepository
{
    private readonly QaflatyDbContext _context;

    public RelatedProductRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<RelatedProductLink>> GetByProductIdAsync(
        ProductId productId, ProductRelationType? relationType = null, CancellationToken ct = default)
    {
        var query = _context.RelatedProductLinks.Where(l => l.ProductId == productId);
        if (relationType is not null)
            query = query.Where(l => l.RelationType == relationType.Value);

        return await query.OrderBy(l => l.SortOrder).ToListAsync(ct);
    }

    public async Task<IReadOnlyList<RelatedProductLink>> GetByProductIdsAsync(
        IReadOnlyCollection<ProductId> productIds, ProductRelationType relationType, CancellationToken ct = default)
    {
        if (productIds.Count == 0)
            return [];

        return await _context.RelatedProductLinks
            .Where(l => productIds.Contains(l.ProductId) && l.RelationType == relationType && l.IsEnabled)
            .OrderBy(l => l.SortOrder)
            .ToListAsync(ct);
    }

    public async Task AddAsync(RelatedProductLink link, CancellationToken ct = default)
        => await _context.RelatedProductLinks.AddAsync(link, ct);

    public void RemoveRange(IEnumerable<RelatedProductLink> links)
        => _context.RelatedProductLinks.RemoveRange(links);
}
