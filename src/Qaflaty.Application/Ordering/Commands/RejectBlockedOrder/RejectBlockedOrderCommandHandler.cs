using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Enums;
using Qaflaty.Domain.Ordering.Errors;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Ordering.Commands.RejectBlockedOrder;

public class RejectBlockedOrderCommandHandler : ICommandHandler<RejectBlockedOrderCommand>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public RejectBlockedOrderCommandHandler(
        IOrderRepository orderRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _orderRepository = orderRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(RejectBlockedOrderCommand request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null ||
            !await _storeRepository.CanMerchantAccessStoreAsync(
                _currentUserService.MerchantId ?? default, store.Id, cancellationToken))
            return Result.Failure(Error.Unauthorized);

        var order = await _orderRepository.GetByIdAsync(new OrderId(request.OrderId), cancellationToken);
        if (order == null || order.StoreId != storeId)
            return Result.Failure(OrderingErrors.OrderNotFound);

        if (order.Status != OrderStatus.Blocked)
            return Result.Failure(OrderingErrors.OrderNotBlocked);

        var reason = string.IsNullOrWhiteSpace(request.Reason)
            ? "Rejected: placed from a blocked phone number"
            : request.Reason;

        var rejectResult = order.RejectBlocked(reason, _currentUserService.Email ?? "System");
        if (rejectResult.IsFailure)
            return rejectResult;

        _orderRepository.Update(order);
        return Result.Success();
    }
}
