using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Ordering.Errors;
using Qaflaty.Domain.Ordering.Repositories;
using Qaflaty.Domain.Ordering.Services;

namespace Qaflaty.Application.Ordering.Commands.RefundPayment;

public class RefundPaymentCommandHandler : ICommandHandler<RefundPaymentCommand, PaymentResultDto>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPaymentProcessor _paymentProcessor;

    public RefundPaymentCommandHandler(
        IOrderRepository orderRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService,
        IPaymentProcessor paymentProcessor)
    {
        _orderRepository = orderRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
        _paymentProcessor = paymentProcessor;
    }

    public async Task<Result<PaymentResultDto>> Handle(RefundPaymentCommand request, CancellationToken cancellationToken)
    {
        var orderId = new OrderId(request.OrderId);
        var order = await _orderRepository.GetByIdAsync(orderId, cancellationToken);
        if (order == null)
            return Result.Failure<PaymentResultDto>(OrderingErrors.OrderNotFound);

        var store = await _storeRepository.GetByIdAsync(order.StoreId, cancellationToken);
        if (store == null || store.MerchantId.Value != _currentUserService.MerchantId?.Value)
            return Result.Failure<PaymentResultDto>(new Error("Order.Unauthorized", "You don't have access to this order"));

        if (order.Payment.TransactionId == null)
            return Result.Failure<PaymentResultDto>(new Error("Order.NoTransaction", "No transaction to refund"));

        var refundRequest = new RefundRequest(order.Id, order.Payment.TransactionId, order.Pricing.Total);
        var refundResult = await _paymentProcessor.RefundAsync(refundRequest, cancellationToken);

        if (refundResult.Success)
        {
            var result = order.Refund(refundResult.TransactionId!);
            if (result.IsFailure)
                return Result.Failure<PaymentResultDto>(result.Error);
        }

        _orderRepository.Update(order);

        return Result.Success(new PaymentResultDto(
            refundResult.Success,
            refundResult.TransactionId,
            refundResult.ErrorMessage
        ));
    }
}
