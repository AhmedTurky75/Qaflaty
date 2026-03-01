using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Aggregates.Order;
using Qaflaty.Domain.Ordering.Repositories;
using Qaflaty.Infrastructure.Persistence;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class OrderOtpRepository : IOrderOtpRepository
{
    private readonly QaflatyDbContext _context;

    public OrderOtpRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<OrderOtp?> GetActiveByOrderIdAsync(OrderId orderId, CancellationToken ct = default)
        => await _context.OrderOtps
            .Where(o => o.OrderId == orderId && !o.IsUsed)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync(ct);

    public async Task<OrderOtp?> GetMostRecentByOrderIdAsync(OrderId orderId, CancellationToken ct = default)
        => await _context.OrderOtps
            .Where(o => o.OrderId == orderId)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync(ct);

    public async Task AddAsync(OrderOtp otp, CancellationToken ct = default)
        => await _context.OrderOtps.AddAsync(otp, ct);

    public void Update(OrderOtp otp)
        => _context.OrderOtps.Update(otp);
}
