using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Ordering.Enums;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Ordering.Queries.GetOrderStats;

public class GetOrderStatsQueryHandler : IQueryHandler<GetOrderStatsQuery, OrderStatsDto>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetOrderStatsQueryHandler(
        IOrderRepository orderRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _orderRepository = orderRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<OrderStatsDto>> Handle(GetOrderStatsQuery request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null || store.MerchantId.Value != _currentUserService.MerchantId?.Value)
            return Result.Failure<OrderStatsDto>(Error.Unauthorized);

        var orders = await _orderRepository.GetByStoreIdAsync(storeId, cancellationToken);

        var totalOrders = orders.Count;
        var pendingOrders = orders.Count(o => o.Status == OrderStatus.Pending);
        var confirmedOrders = orders.Count(o => o.Status == OrderStatus.Confirmed);
        var processingOrders = orders.Count(o => o.Status == OrderStatus.Processing);
        var shippedOrders = orders.Count(o => o.Status == OrderStatus.Shipped);
        var deliveredOrders = orders.Count(o => o.Status == OrderStatus.Delivered);
        var cancelledOrders = orders.Count(o => o.Status == OrderStatus.Cancelled);

        var deliveredOrdersList = orders.Where(o => o.Status == OrderStatus.Delivered).ToList();
        var totalRevenue = deliveredOrdersList.Sum(o => o.Pricing.Total.Amount);
        var averageOrderValue = deliveredOrdersList.Count > 0
            ? totalRevenue / deliveredOrdersList.Count
            : 0;

        return Result.Success(new OrderStatsDto(
            totalOrders,
            pendingOrders,
            confirmedOrders,
            processingOrders,
            shippedOrders,
            deliveredOrders,
            cancelledOrders,
            totalRevenue,
            averageOrderValue
        ));
    }
}
