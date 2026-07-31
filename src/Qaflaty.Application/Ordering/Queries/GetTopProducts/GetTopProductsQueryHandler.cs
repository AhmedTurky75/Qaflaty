using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Ordering.Enums;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Ordering.Queries.GetTopProducts;

public class GetTopProductsQueryHandler : IQueryHandler<GetTopProductsQuery, IReadOnlyList<TopProductDto>>
{
    private const int MinLimit = 1;
    private const int MaxLimit = 50;

    // Orders that were cancelled or held against the blocklist never became sales, so their line
    // items must not colour the merchandising picture. Everything else counts: this panel answers
    // "what is selling and needs restocking", which is a demand signal rather than an accounting
    // figure, so it does not wait for orders to reach Delivered the way Total revenue does.
    private static readonly OrderStatus[] ExcludedStatuses = [OrderStatus.Cancelled, OrderStatus.Blocked];

    private readonly IOrderRepository _orderRepository;
    private readonly IProductRepository _productRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetTopProductsQueryHandler(
        IOrderRepository orderRepository,
        IProductRepository productRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _orderRepository = orderRepository;
        _productRepository = productRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<IReadOnlyList<TopProductDto>>> Handle(
        GetTopProductsQuery request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null ||
            !await _storeRepository.CanMerchantAccessStoreAsync(
                _currentUserService.MerchantId ?? default, store.Id, cancellationToken))
            return Result.Failure<IReadOnlyList<TopProductDto>>(Error.Unauthorized);

        var limit = Math.Clamp(request.Limit, MinLimit, MaxLimit);

        var orders = await _orderRepository.GetByStoreIdAsync(storeId, cancellationToken);

        var soldItems = orders
            .Where(o => !ExcludedStatuses.Contains(o.Status))
            .SelectMany(o => o.Items)
            .ToList();

        if (soldItems.Count == 0)
            return Result.Success<IReadOnlyList<TopProductDto>>([]);

        var products = await _productRepository.GetByStoreIdAsync(storeId, cancellationToken);
        var productsById = products.ToDictionary(p => p.Id.Value);

        var top = soldItems
            .GroupBy(i => i.ProductId.Value)
            .Select(g => new
            {
                ProductId = g.Key,
                SalesCount = g.Sum(i => i.Quantity),
                Revenue = g.Sum(i => i.Total.Amount),
                // Line items snapshot the product name at order time, so a deleted product still
                // shows the name the customer actually bought.
                SnapshotName = g.First().ProductName
            })
            .OrderByDescending(x => x.SalesCount)
            .ThenByDescending(x => x.Revenue)
            .Take(limit)
            .Select(x =>
            {
                var product = productsById.GetValueOrDefault(x.ProductId);
                var image = product?.Images.OrderBy(i => i.SortOrder).FirstOrDefault();
                return new TopProductDto(
                    x.ProductId,
                    product?.Name.Value ?? x.SnapshotName,
                    x.SalesCount,
                    x.Revenue,
                    image?.Url);
            })
            .ToList();

        return Result.Success<IReadOnlyList<TopProductDto>>(top);
    }
}
