using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Aggregates.Return;
using Qaflaty.Domain.Ordering.Errors;
using Qaflaty.Domain.Ordering.Repositories;
using Qaflaty.Domain.Ordering.ValueObjects;

namespace Qaflaty.Application.Ordering.Commands.RequestReturn;

public class RequestReturnCommandHandler : ICommandHandler<RequestReturnCommand, ReturnRequestDto>
{
    private readonly IOrderRepository _orderRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly IReturnRequestRepository _returnRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly ITenantContext _tenantContext;

    public RequestReturnCommandHandler(
        IOrderRepository orderRepository,
        ICustomerRepository customerRepository,
        IReturnRequestRepository returnRepository,
        ICurrentUserService currentUserService,
        ITenantContext tenantContext)
    {
        _orderRepository = orderRepository;
        _customerRepository = customerRepository;
        _returnRepository = returnRepository;
        _currentUserService = currentUserService;
        _tenantContext = tenantContext;
    }

    public async Task<Result<ReturnRequestDto>> Handle(RequestReturnCommand request, CancellationToken ct)
    {
        if (!_currentUserService.IsCustomer || string.IsNullOrEmpty(_currentUserService.Email))
            return Result.Failure<ReturnRequestDto>(Error.Unauthorized);

        if (_tenantContext.CurrentStoreId is null)
            return Result.Failure<ReturnRequestDto>(OrderingErrors.OrderNotFound);

        var storeId = _tenantContext.CurrentStoreId.Value;

        var orderNumberResult = OrderNumber.Parse(request.OrderNumber);
        if (orderNumberResult.IsFailure)
            return Result.Failure<ReturnRequestDto>(OrderingErrors.OrderNotFound);

        var order = await _orderRepository.GetByOrderNumberAsync(storeId, orderNumberResult.Value, ct);
        if (order is null)
            return Result.Failure<ReturnRequestDto>(OrderingErrors.OrderNotFound);

        // The order must belong to the signed-in customer (matched by email → Ordering customer).
        var customer = await _customerRepository.GetByEmailAsync(storeId, _currentUserService.Email, ct);
        if (customer is null || order.CustomerId != customer.Id)
            return Result.Failure<ReturnRequestDto>(OrderingErrors.OrderNotFound);

        if (await _returnRepository.HasOpenReturnAsync(order.Id, ct))
            return Result.Failure<ReturnRequestDto>(ReturnErrors.AlreadyRequested);

        var selections = request.Items
            .Select(i => (new ProductId(i.ProductId), i.Quantity))
            .ToList();

        var result = ReturnRequest.Create(order, selections, request.Reason);
        if (result.IsFailure)
            return Result.Failure<ReturnRequestDto>(result.Error);

        await _returnRepository.AddAsync(result.Value, ct);
        return Result.Success(result.Value.ToDto());
    }
}
