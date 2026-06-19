using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Storefront.Recommendations.GetFrequentlyBoughtTogether;

/// <summary>
/// Recommends products most frequently purchased in the same order as the
/// target product, ranked by co-occurrence count across historical orders.
/// </summary>
public class GetFrequentlyBoughtTogetherQueryHandler
    : IQueryHandler<GetFrequentlyBoughtTogetherQuery, IReadOnlyList<ProductPublicDto>>
{
    private readonly IProductRepository _productRepository;
    private readonly IOrderRepository _orderRepository;

    public GetFrequentlyBoughtTogetherQueryHandler(
        IProductRepository productRepository,
        IOrderRepository orderRepository)
    {
        _productRepository = productRepository;
        _orderRepository = orderRepository;
    }

    public async Task<Result<IReadOnlyList<ProductPublicDto>>> Handle(
        GetFrequentlyBoughtTogetherQuery request, CancellationToken ct)
    {
        var target = await _productRepository.GetByIdAsync(request.ProductId, ct);
        if (target is null)
            return Result.Success<IReadOnlyList<ProductPublicDto>>([]);

        var orders = await _orderRepository.GetByStoreIdAsync(target.StoreId, ct);

        var coCounts = new Dictionary<Guid, int>();
        foreach (var order in orders)
        {
            if (!order.Items.Any(i => i.ProductId == request.ProductId))
                continue;

            foreach (var item in order.Items)
            {
                var pid = item.ProductId.Value;
                if (pid == request.ProductId.Value)
                    continue;
                coCounts[pid] = coCounts.GetValueOrDefault(pid) + item.Quantity;
            }
        }

        if (coCounts.Count == 0)
            return Result.Success<IReadOnlyList<ProductPublicDto>>([]);

        var rankedIds = coCounts
            .OrderByDescending(kv => kv.Value)
            .Select(kv => kv.Key)
            .ToList();

        var storeProducts = await _productRepository.GetByStoreIdAsync(target.StoreId, ct);
        var byId = storeProducts
            .Where(p => p.Status == ProductStatus.Active)
            .ToDictionary(p => p.Id.Value);

        var result = rankedIds
            .Where(byId.ContainsKey)
            .Take(request.Take)
            .Select(id => ProductRecommendationMapper.Map(byId[id]))
            .ToList();

        return Result.Success<IReadOnlyList<ProductPublicDto>>(result);
    }
}
