using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Ordering.Errors;
using Qaflaty.Domain.Ordering.Repositories;
using Qaflaty.Domain.Ordering.Services;

namespace Qaflaty.Application.Ordering.Commands.ProcessPayment;

public class ProcessPaymentCommandHandler : ICommandHandler<ProcessPaymentCommand, PaymentResultDto>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPaymentProcessor _paymentProcessor;

    public ProcessPaymentCommandHandler(
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

    public async Task<Result<PaymentResultDto>> Handle(ProcessPaymentCommand request, CancellationToken cancellationToken)
    {
        var orderId = new OrderId(request.OrderId);
        var order = await _orderRepository.GetByIdAsync(orderId, cancellationToken);
        if (order == null)
            return Result.Failure<PaymentResultDto>(OrderingErrors.OrderNotFound);

        var store = await _storeRepository.GetByIdAsync(order.StoreId, cancellationToken);
        if (store == null || store.MerchantId.Value != _currentUserService.MerchantId?.Value)
            return Result.Failure<PaymentResultDto>(new Error("Order.Unauthorized", "You don't have access to this order"));

        var paymentRequest = new PaymentRequest(order.Id, order.Pricing.Total, order.Payment.Method);
        var paymentResult = await _paymentProcessor.ProcessAsync(paymentRequest, cancellationToken);

        if (paymentResult.Success)
        {
            order.ProcessPayment(paymentResult.TransactionId!);
        }
        else
        {
            order.FailPayment(paymentResult.ErrorMessage ?? "Payment failed");
        }

        _orderRepository.Update(order);

        return Result.Success(new PaymentResultDto(
            paymentResult.Success,
            paymentResult.TransactionId,
            paymentResult.ErrorMessage
        ));
    }
}
