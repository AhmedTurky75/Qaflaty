using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Common.Models;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Ordering.Queries.GetStoreOrders;

public class GetStoreOrdersQueryHandler : IQueryHandler<GetStoreOrdersQuery, PaginatedList<OrderListDto>>
{
    private readonly IOrderRepository _orderRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetStoreOrdersQueryHandler(
        IOrderRepository orderRepository,
        ICustomerRepository customerRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _orderRepository = orderRepository;
        _customerRepository = customerRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<PaginatedList<OrderListDto>>> Handle(GetStoreOrdersQuery request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null || store.MerchantId.Value != _currentUserService.MerchantId?.Value)
            return Result.Failure<PaginatedList<OrderListDto>>(Error.Unauthorized);

        var orders = await _orderRepository.GetByStoreIdAsync(storeId, cancellationToken);
        var customers = await _customerRepository.GetByStoreIdAsync(storeId, cancellationToken);
        var customerLookup = customers.ToDictionary(c => c.Id.Value);

        var query = orders.AsEnumerable();

        // Filter by status
        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(o => o.Status.ToString().Equals(request.Status, StringComparison.OrdinalIgnoreCase));

        // Filter by search term (order number or customer name)
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            query = query.Where(o =>
                o.OrderNumber.Value.Contains(request.SearchTerm, StringComparison.OrdinalIgnoreCase) ||
                (customerLookup.TryGetValue(o.CustomerId.Value, out var c) &&
                 c.Contact.FullName.Value.Contains(request.SearchTerm, StringComparison.OrdinalIgnoreCase)));
        }

        // Order by most recent first
        query = query.OrderByDescending(o => o.CreatedAt);

        var dtos = query.Select(o =>
        {
            var customer = customerLookup.GetValueOrDefault(o.CustomerId.Value);
            return new OrderListDto(
                o.Id.Value,
                o.OrderNumber.Value,
                o.Status.ToString(),
                customer?.Contact.FullName.Value ?? "Unknown",
                customer?.Contact.Phone.Value ?? "Unknown",
                o.Pricing.Total.Amount,
                o.Items.Count,
                o.Payment.Method.ToString(),
                o.Payment.Status.ToString(),
                o.CreatedAt
            );
        });

        return Result.Success(PaginatedList<OrderListDto>.Create(dtos, request.PageNumber, request.PageSize));
    }
}
