using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Aggregates.Return;
using Qaflaty.Domain.Ordering.Enums;

namespace Qaflaty.Domain.Ordering.Repositories;

public interface IReturnRequestRepository
{
    Task<ReturnRequest?> GetByIdAsync(ReturnRequestId id, CancellationToken ct = default);

    Task<IReadOnlyList<ReturnRequest>> GetByStoreAsync(
        StoreId storeId, ReturnStatus? status = null, CancellationToken ct = default);

    Task<IReadOnlyList<ReturnRequest>> GetByOrderAsync(OrderId orderId, CancellationToken ct = default);

    /// <summary>True when the order already has a return that is open or resolved (not rejected/cancelled).</summary>
    Task<bool> HasOpenReturnAsync(OrderId orderId, CancellationToken ct = default);

    Task AddAsync(ReturnRequest request, CancellationToken ct = default);
    void Update(ReturnRequest request);
}
