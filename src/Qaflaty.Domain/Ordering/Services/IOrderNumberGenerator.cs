using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.ValueObjects;

namespace Qaflaty.Domain.Ordering.Services;

public interface IOrderNumberGenerator
{
    Task<OrderNumber> GenerateAsync(StoreId storeId, CancellationToken ct = default);
}
