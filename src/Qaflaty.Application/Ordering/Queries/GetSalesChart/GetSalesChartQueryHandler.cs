using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Ordering.Enums;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Ordering.Queries.GetSalesChart;

public class GetSalesChartQueryHandler : IQueryHandler<GetSalesChartQuery, IReadOnlyList<SalesChartPointDto>>
{
    private const int MinDays = 1;
    private const int MaxDays = 365;

    private readonly IOrderRepository _orderRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IDateTimeProvider _dateTimeProvider;

    public GetSalesChartQueryHandler(
        IOrderRepository orderRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService,
        IDateTimeProvider dateTimeProvider)
    {
        _orderRepository = orderRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
        _dateTimeProvider = dateTimeProvider;
    }

    public async Task<Result<IReadOnlyList<SalesChartPointDto>>> Handle(
        GetSalesChartQuery request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null ||
            !await _storeRepository.CanMerchantAccessStoreAsync(
                _currentUserService.MerchantId ?? default, store.Id, cancellationToken))
            return Result.Failure<IReadOnlyList<SalesChartPointDto>>(Error.Unauthorized);

        var days = Math.Clamp(request.Days, MinDays, MaxDays);

        // The window runs over whole UTC days and ends with today, so "7 days" means today plus the
        // six days before it.
        var today = _dateTimeProvider.UtcNow.Date;
        var windowStart = today.AddDays(-(days - 1));

        var orders = await _orderRepository.GetByStoreIdAsync(storeId, cancellationToken);

        var inWindow = orders
            .Where(o => o.Status != OrderStatus.Blocked)
            .Where(o => o.CreatedAt.Date >= windowStart && o.CreatedAt.Date <= today)
            .ToList();

        // The two series deliberately follow the stat cards above the chart: the order count covers
        // every accepted order, while revenue counts only Delivered orders — money the merchant has
        // actually earned. A day can therefore show orders with no revenue yet.
        var ordersByDay = inWindow
            .GroupBy(o => o.CreatedAt.Date)
            .ToDictionary(g => g.Key, g => g.Count());

        var revenueByDay = inWindow
            .Where(o => o.Status == OrderStatus.Delivered)
            .GroupBy(o => o.CreatedAt.Date)
            .ToDictionary(g => g.Key, g => g.Sum(o => o.Pricing.Total.Amount));

        var points = Enumerable.Range(0, days)
            .Select(offset =>
            {
                var day = windowStart.AddDays(offset);
                return new SalesChartPointDto(
                    day.ToString("yyyy-MM-dd"),
                    revenueByDay.GetValueOrDefault(day),
                    ordersByDay.GetValueOrDefault(day));
            })
            .ToList();

        return Result.Success<IReadOnlyList<SalesChartPointDto>>(points);
    }
}
