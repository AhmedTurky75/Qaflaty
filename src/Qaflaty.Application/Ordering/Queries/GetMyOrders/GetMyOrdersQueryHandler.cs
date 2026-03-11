using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Ordering.Queries.GetMyOrders;

public class GetMyOrdersQueryHandler : IQueryHandler<GetMyOrdersQuery, List<MyOrderDto>>
{
    private readonly IOrderRepository _orderRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly ITenantContext _tenantContext;

    public GetMyOrdersQueryHandler(
        IOrderRepository orderRepository,
        ICustomerRepository customerRepository,
        ICurrentUserService currentUserService,
        ITenantContext tenantContext)
    {
        _orderRepository = orderRepository;
        _customerRepository = customerRepository;
        _currentUserService = currentUserService;
        _tenantContext = tenantContext;
    }

    public async Task<Result<List<MyOrderDto>>> Handle(GetMyOrdersQuery request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsCustomer)
            return Result.Failure<List<MyOrderDto>>(Error.Unauthorized);

        var email = _currentUserService.Email;
        if (string.IsNullOrEmpty(email) || _tenantContext.CurrentStoreId == null)
            return Result.Success(new List<MyOrderDto>());

        var storeId = _tenantContext.CurrentStoreId.Value;
        var customer = await _customerRepository.GetByEmailAsync(storeId, email, cancellationToken);
        if (customer == null)
            return Result.Success(new List<MyOrderDto>());

        var orders = await _orderRepository.GetByCustomerIdAsync(customer.Id, cancellationToken);

        return Result.Success(orders
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new MyOrderDto(
                o.Id.Value,
                o.OrderNumber.Value,
                o.CreatedAt.ToString("O"),
                o.Status.ToString(),
                o.Pricing.Total.Amount,
                o.Items.Count
            )).ToList());
    }
}
