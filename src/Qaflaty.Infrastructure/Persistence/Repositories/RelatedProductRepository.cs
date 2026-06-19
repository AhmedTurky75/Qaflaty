using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.RelatedProduct;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class RelatedProductRepository : IRelatedProductRepository
{
    private readonly QaflatyDbContext _context;

    public RelatedProductRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<RelatedProductLink>> GetByProductIdAsync(ProductId productId, CancellationToken ct = default)
        => await _context.RelatedProductLinks
            .Where(l => l.ProductId == productId)
            .OrderBy(l => l.SortOrder)
            .ToListAsync(ct);

    public async Task AddAsync(RelatedProductLink link, CancellationToken ct = default)
        => await _context.RelatedProductLinks.AddAsync(link, ct);

    public void RemoveRange(IEnumerable<RelatedProductLink> links)
        => _context.RelatedProductLinks.RemoveRange(links);
}
