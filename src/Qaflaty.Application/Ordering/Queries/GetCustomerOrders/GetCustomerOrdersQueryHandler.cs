using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Ordering.Errors;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Ordering.Queries.GetCustomerOrders;

public class GetCustomerOrdersQueryHandler : IQueryHandler<GetCustomerOrdersQuery, List<OrderListDto>>
{
    private readonly ICustomerRepository _customerRepository;
    private readonly IOrderRepository _orderRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetCustomerOrdersQueryHandler(
        ICustomerRepository customerRepository,
        IOrderRepository orderRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _customerRepository = customerRepository;
        _orderRepository = orderRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<List<OrderListDto>>> Handle(GetCustomerOrdersQuery request, CancellationToken cancellationToken)
    {
        var customerId = new CustomerId(request.CustomerId);
        var customer = await _customerRepository.GetByIdAsync(customerId, cancellationToken);
        if (customer == null)
            return Result.Failure<List<OrderListDto>>(OrderingErrors.CustomerNotFound);

        var store = await _storeRepository.GetByIdAsync(customer.StoreId, cancellationToken);
        if (store == null || store.MerchantId.Value != _currentUserService.MerchantId?.Value)
            return Result.Failure<List<OrderListDto>>(Error.Unauthorized);

        var orders = await _orderRepository.GetByCustomerIdAsync(customerId, cancellationToken);

        return Result.Success(orders
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrderListDto(
                o.Id.Value,
                o.OrderNumber.Value,
                o.Status.ToString(),
                customer.Contact.FullName.Value,
                customer.Contact.Phone.Value,
                o.Pricing.Total.Amount,
                o.Items.Count,
                o.Payment.Method.ToString(),
                o.Payment.Status.ToString(),
                o.CreatedAt
            )).ToList());
    }
}
