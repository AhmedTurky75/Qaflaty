using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.ProductReview;
using Qaflaty.Domain.Storefront.Enums;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class ProductReviewRepository : IProductReviewRepository
{
    private readonly QaflatyDbContext _context;

    public ProductReviewRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<ProductReview?> GetByIdAsync(ProductReviewId id, CancellationToken ct = default)
        => await _context.ProductReviews
            .Include(r => r.Media)
            .FirstOrDefaultAsync(r => r.Id == id, ct);

    public async Task<ProductReview?> GetByCustomerAndProductAsync(
        StoreCustomerId customerId, ProductId productId, CancellationToken ct = default)
        => await _context.ProductReviews
            .Include(r => r.Media)
            .FirstOrDefaultAsync(r => r.CustomerId == customerId && r.ProductId == productId, ct);

    public async Task<IReadOnlyList<ProductReview>> GetApprovedByProductIdAsync(
        ProductId productId, CancellationToken ct = default)
        => await _context.ProductReviews
            .Include(r => r.Media)
            .Where(r => r.ProductId == productId && r.Status == ReviewStatus.Approved)
            .OrderByDescending(r => r.IsPinned)
            .ThenByDescending(r => r.CreatedAt)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<ProductReview>> GetForModerationAsync(
        StoreId storeId, ProductId? productId = null, ReviewStatus? status = null, CancellationToken ct = default)
    {
        var query = _context.ProductReviews
            .Include(r => r.Media)
            .Where(r => r.StoreId == storeId);

        if (productId is not null)
            query = query.Where(r => r.ProductId == productId.Value);

        if (status is not null)
            query = query.Where(r => r.Status == status.Value);

        return await query
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task AddAsync(ProductReview review, CancellationToken ct = default)
        => await _context.ProductReviews.AddAsync(review, ct);

    public void Update(ProductReview review)
        => _context.ProductReviews.Update(review);

    public void Delete(ProductReview review)
        => _context.ProductReviews.Remove(review);
}
