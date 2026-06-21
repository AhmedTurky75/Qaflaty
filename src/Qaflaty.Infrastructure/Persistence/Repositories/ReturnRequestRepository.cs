using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Aggregates.Return;
using Qaflaty.Domain.Ordering.Enums;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class ReturnRequestRepository : IReturnRequestRepository
{
    private readonly QaflatyDbContext _context;

    public ReturnRequestRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<ReturnRequest?> GetByIdAsync(ReturnRequestId id, CancellationToken ct = default)
        => await _context.ReturnRequests
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.Id == id, ct);

    public async Task<IReadOnlyList<ReturnRequest>> GetByStoreAsync(
        StoreId storeId, ReturnStatus? status = null, CancellationToken ct = default)
    {
        var query = _context.ReturnRequests
            .Include(r => r.Items)
            .Where(r => r.StoreId == storeId);

        if (status is not null)
            query = query.Where(r => r.Status == status.Value);

        return await query
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<ReturnRequest>> GetByOrderAsync(OrderId orderId, CancellationToken ct = default)
        => await _context.ReturnRequests
            .Include(r => r.Items)
            .Where(r => r.OrderId == orderId)
            .ToListAsync(ct);

    public async Task<bool> HasOpenReturnAsync(OrderId orderId, CancellationToken ct = default)
        => await _context.ReturnRequests.AnyAsync(
            r => r.OrderId == orderId &&
                 r.Status != ReturnStatus.Rejected &&
                 r.Status != ReturnStatus.Cancelled,
            ct);

    public async Task AddAsync(ReturnRequest request, CancellationToken ct = default)
        => await _context.ReturnRequests.AddAsync(request, ct);

    public void Update(ReturnRequest request)
        => _context.ReturnRequests.Update(request);
}
