using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Repositories;
using ProductViewEntity = Qaflaty.Domain.Storefront.Aggregates.ProductView.ProductView;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class ProductViewRepository : IProductViewRepository
{
    private readonly QaflatyDbContext _context;

    public ProductViewRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(ProductViewEntity view, CancellationToken ct = default)
        => await _context.ProductViews.AddAsync(view, ct);

    public async Task<IReadOnlyList<Guid>> GetMostViewedProductIdsAsync(
        StoreId storeId, DateTime since, int take, CancellationToken ct = default)
    {
        var grouped = await _context.ProductViews
            .Where(v => v.StoreId == storeId && v.ViewedAt >= since)
            .GroupBy(v => v.ProductId)
            .Select(g => new { ProductId = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        return grouped
            .OrderByDescending(x => x.Count)
            .Take(take)
            .Select(x => x.ProductId.Value)
            .ToList();
    }

    public async Task<IReadOnlyList<Guid>> GetRecentlyViewedProductIdsAsync(
        StoreId storeId, StoreCustomerId? customerId, string? sessionId, int take, CancellationToken ct = default)
    {
        var query = _context.ProductViews.Where(v => v.StoreId == storeId);

        if (customerId is not null)
            query = query.Where(v => v.CustomerId == customerId);
        else if (!string.IsNullOrWhiteSpace(sessionId))
            query = query.Where(v => v.SessionId == sessionId);
        else
            return [];

        var rows = await query
            .OrderByDescending(v => v.ViewedAt)
            .Select(v => v.ProductId)
            .ToListAsync(ct);

        // Distinct product ids, preserving most-recent-first order.
        var result = new List<Guid>();
        var seen = new HashSet<Guid>();
        foreach (var pid in rows)
        {
            if (seen.Add(pid.Value))
            {
                result.Add(pid.Value);
                if (result.Count >= take) break;
            }
        }

        return result;
    }
}
