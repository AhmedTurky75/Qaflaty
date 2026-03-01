using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Aggregates.Order;

namespace Qaflaty.Domain.Ordering.Repositories;

public interface IOrderOtpRepository
{
    Task<OrderOtp?> GetActiveByOrderIdAsync(OrderId orderId, CancellationToken ct = default);
    Task<OrderOtp?> GetMostRecentByOrderIdAsync(OrderId orderId, CancellationToken ct = default);
    Task AddAsync(OrderOtp otp, CancellationToken ct = default);
    void Update(OrderOtp otp);
}
