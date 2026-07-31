using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Ordering.Aggregates.Order;
using Qaflaty.Domain.Ordering.Enums;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Ordering.Queries.GetOrderStats;

public class GetOrderStatsQueryHandler : IQueryHandler<GetOrderStatsQuery, OrderStatsDto>
{
    // Both trend figures compare the last 30 days against the 30 days immediately before them.
    private const int TrendWindowDays = 30;

    private readonly IOrderRepository _orderRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly IProductRepository _productRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IDateTimeProvider _dateTimeProvider;

    public GetOrderStatsQueryHandler(
        IOrderRepository orderRepository,
        IStoreRepository storeRepository,
        IProductRepository productRepository,
        ICustomerRepository customerRepository,
        ICurrentUserService currentUserService,
        IDateTimeProvider dateTimeProvider)
    {
        _orderRepository = orderRepository;
        _storeRepository = storeRepository;
        _productRepository = productRepository;
        _customerRepository = customerRepository;
        _currentUserService = currentUserService;
        _dateTimeProvider = dateTimeProvider;
    }

    public async Task<Result<OrderStatsDto>> Handle(GetOrderStatsQuery request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null ||
            !await _storeRepository.CanMerchantAccessStoreAsync(
                _currentUserService.MerchantId ?? default, store.Id, cancellationToken))
            return Result.Failure<OrderStatsDto>(Error.Unauthorized);

        var orders = await _orderRepository.GetByStoreIdAsync(storeId, cancellationToken);
        var products = await _productRepository.GetByStoreIdAsync(storeId, cancellationToken);
        var customers = await _customerRepository.GetByStoreIdAsync(storeId, cancellationToken);

        var blockedOrders = orders.Count(o => o.Status == OrderStatus.Blocked);

        // Orders held against the phone blocklist are not real orders yet — the merchant has not
        // accepted them — so they are surfaced as their own figure rather than folded into the total.
        var totalOrders = orders.Count - blockedOrders;

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

        // Trend windows key on CreatedAt (when the order was placed), so an order that reaches
        // Delivered later still counts towards the period it was actually placed in.
        var now = _dateTimeProvider.UtcNow;
        var currentWindowStart = now.AddDays(-TrendWindowDays);
        var previousWindowStart = now.AddDays(-TrendWindowDays * 2);

        var currentRevenue = SumRevenue(deliveredOrdersList, currentWindowStart, now);
        var previousRevenue = SumRevenue(deliveredOrdersList, previousWindowStart, currentWindowStart);

        var countableOrders = orders.Where(o => o.Status != OrderStatus.Blocked).ToList();
        var currentOrderCount = CountOrders(countableOrders, currentWindowStart, now);
        var previousOrderCount = CountOrders(countableOrders, previousWindowStart, currentWindowStart);

        return Result.Success(new OrderStatsDto(
            totalOrders,
            pendingOrders,
            confirmedOrders,
            processingOrders,
            shippedOrders,
            deliveredOrders,
            cancelledOrders,
            blockedOrders,
            totalRevenue,
            averageOrderValue,
            products.Count,
            customers.Count,
            PercentageChange(currentRevenue, previousRevenue),
            PercentageChange(currentOrderCount, previousOrderCount)
        ));
    }

    private static decimal SumRevenue(IEnumerable<Order> orders, DateTime fromInclusive, DateTime toExclusive)
        => orders
            .Where(o => o.CreatedAt >= fromInclusive && o.CreatedAt < toExclusive)
            .Sum(o => o.Pricing.Total.Amount);

    private static int CountOrders(IEnumerable<Order> orders, DateTime fromInclusive, DateTime toExclusive)
        => orders.Count(o => o.CreatedAt >= fromInclusive && o.CreatedAt < toExclusive);

    /// <summary>
    /// Percentage change from <paramref name="previous"/> to <paramref name="current"/>, rounded to
    /// one decimal. With no prior activity there is no meaningful ratio, so growth from zero is
    /// reported as a flat +100% and zero-to-zero as no change.
    /// </summary>
    private static decimal PercentageChange(decimal current, decimal previous)
    {
        if (previous == 0)
            return current > 0 ? 100m : 0m;

        return Math.Round((current - previous) / Math.Abs(previous) * 100m, 1);
    }
}
