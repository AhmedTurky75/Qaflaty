using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Repositories;
using Qaflaty.Domain.Ordering.Services;
using Qaflaty.Domain.Ordering.ValueObjects;

namespace Qaflaty.Infrastructure.Services.Ordering;

public class OrderNumberGenerator : IOrderNumberGenerator
{
    private readonly IOrderRepository _orderRepository;

    public OrderNumberGenerator(IOrderRepository orderRepository)
    {
        _orderRepository = orderRepository;
    }

    public async Task<OrderNumber> GenerateAsync(StoreId storeId, CancellationToken ct = default)
    {
        // Generate unique order numbers, retrying on collision
        const int maxAttempts = 10;

        for (int i = 0; i < maxAttempts; i++)
        {
            var orderNumber = OrderNumber.Generate();
            var existing = await _orderRepository.GetByOrderNumberAsync(storeId, orderNumber, ct);
            if (existing == null)
                return orderNumber;
        }

        // Fallback: use timestamp-based number
        var timestamp = DateTime.UtcNow.ToString("HHmmss");
        var parseResult = OrderNumber.Parse($"QAF-{timestamp}");
        return parseResult.Value;
    }
}
