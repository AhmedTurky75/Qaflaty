using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Aggregates.Order;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Storefront.Recommendations;

/// <summary>
/// Everything a recommendation strategy chain (cross-sell, upsell, ...) needs for one store,
/// loaded at most once per top-level recommendation request (a single product-detail lookup, or
/// a whole cart evaluation spanning several cart lines). Orders are fetched lazily and memoized,
/// so the expensive order-history scan only runs if a higher-priority strategy (manual links)
/// didn't already fill the quota.
/// </summary>
internal sealed class RecommendationCandidatePool
{
    public IReadOnlyDictionary<Guid, Product> ProductsById { get; }
    public IReadOnlyList<Product> ActiveProducts { get; }

    private readonly IOrderRepository _orderRepository;
    private readonly StoreId _storeId;
    private IReadOnlyList<Order>? _orders;

    public RecommendationCandidatePool(IReadOnlyList<Product> storeProducts, IOrderRepository orderRepository, StoreId storeId)
    {
        ProductsById = storeProducts.ToDictionary(p => p.Id.Value);
        ActiveProducts = storeProducts.Where(p => p.Status == ProductStatus.Active).ToList();
        _orderRepository = orderRepository;
        _storeId = storeId;
    }

    public async Task<IReadOnlyList<Order>> GetOrdersAsync(CancellationToken ct)
    {
        _orders ??= await _orderRepository.GetByStoreIdAsync(_storeId, ct);
        return _orders;
    }
}
