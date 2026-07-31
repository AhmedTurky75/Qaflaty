using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Ordering.Errors;
using Qaflaty.Domain.Ordering.Repositories;
using Qaflaty.Domain.Ordering.Services;

namespace Qaflaty.Application.Ordering.Commands.ModerateReturn;

public class RefundReturnCommandHandler : ICommandHandler<RefundReturnCommand>
{
    private readonly IReturnRequestRepository _returnRepository;
    private readonly IOrderRepository _orderRepository;
    private readonly IPaymentProcessor _paymentProcessor;

    public RefundReturnCommandHandler(
        IReturnRequestRepository returnRepository,
        IOrderRepository orderRepository,
        IPaymentProcessor paymentProcessor)
    {
        _returnRepository = returnRepository;
        _orderRepository = orderRepository;
        _paymentProcessor = paymentProcessor;
    }

    public async Task<Result> Handle(RefundReturnCommand request, CancellationToken ct)
    {
        var ret = await _returnRepository.GetByIdAsync(request.Id, ct);
        if (ret is null || ret.StoreId != request.StoreId)
            return Result.Failure(ReturnErrors.NotFound);

        var order = await _orderRepository.GetByIdAsync(ret.OrderId, ct);
        if (order is null)
            return Result.Failure(OrderingErrors.OrderNotFound);

        var refundResult = await _paymentProcessor.RefundAsync(
            new RefundRequest(order.Id, order.Payment.TransactionId ?? string.Empty, ret.RefundAmount), ct);

        if (!refundResult.Success)
            return Result.Failure(new Error("Return.RefundFailed",
                refundResult.ErrorMessage ?? "Refund could not be processed"));

        var transactionId = refundResult.TransactionId ?? order.Payment.TransactionId ?? string.Empty;

        var marked = ret.MarkRefunded(transactionId);
        if (marked.IsFailure)
            return marked;

        // Best-effort: reflect the refund on the order payment when it was actually paid online.
        // For unpaid (e.g. COD) orders this is a no-op and the merchant settles the refund manually.
        order.Refund(transactionId);

        _returnRepository.Update(ret);
        _orderRepository.Update(order);
        return Result.Success();
    }
}
