using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Aggregates.Order;
using Qaflaty.Domain.Ordering.Errors;
using Qaflaty.Domain.Ordering.Repositories;
using Qaflaty.Domain.Ordering.ValueObjects;

namespace Qaflaty.Application.Ordering.Commands.VerifyOrderOtp;

public class VerifyOrderOtpCommandHandler : ICommandHandler<VerifyOrderOtpCommand, OrderDto>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IOrderOtpRepository _otpRepository;

    public VerifyOrderOtpCommandHandler(
        IOrderRepository orderRepository,
        IOrderOtpRepository otpRepository)
    {
        _orderRepository = orderRepository;
        _otpRepository = otpRepository;
    }

    public async Task<Result<OrderDto>> Handle(VerifyOrderOtpCommand request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        var orderNumberResult = OrderNumber.Parse(request.OrderNumber);
        if (orderNumberResult.IsFailure)
            return Result.Failure<OrderDto>(orderNumberResult.Error);

        var order = await _orderRepository.GetByOrderNumberAsync(storeId, orderNumberResult.Value, cancellationToken);
        if (order == null)
            return Result.Failure<OrderDto>(OrderingErrors.OrderNotFound);

        if (order.Status != Domain.Ordering.Enums.OrderStatus.Pending)
            return Result.Failure<OrderDto>(OrderingErrors.OrderNotPending);

        var otp = await _otpRepository.GetActiveByOrderIdAsync(order.Id, cancellationToken);
        if (otp == null)
            return Result.Failure<OrderDto>(OrderingErrors.OtpNotFound);

        if (otp.IsExpired())
        {
            otp.Invalidate();
            _otpRepository.Update(otp);
            return Result.Failure<OrderDto>(OrderingErrors.OtpExpired);
        }

        if (otp.IsMaxAttemptsReached())
            return Result.Failure<OrderDto>(OrderingErrors.OtpMaxAttemptsReached);

        var isValid = otp.Verify(request.OtpCode);
        _otpRepository.Update(otp);

        if (!isValid)
        {
            if (otp.IsMaxAttemptsReached())
                return Result.Failure<OrderDto>(OrderingErrors.OtpMaxAttemptsReached);

            return Result.Failure<OrderDto>(OrderingErrors.OtpInvalid);
        }

        var confirmResult = order.Confirm();
        if (confirmResult.IsFailure)
            return Result.Failure<OrderDto>(confirmResult.Error);

        _orderRepository.Update(order);

        return Result.Success(MapToDto(order));
    }

    private static OrderDto MapToDto(Order order) => new(
        order.Id.Value,
        order.StoreId.Value,
        order.CustomerId.Value,
        order.OrderNumber.Value,
        order.Status.ToString(),
        order.Pricing.Subtotal.Amount,
        order.Pricing.DeliveryFee.Amount,
        order.Pricing.Total.Amount,
        order.Payment.Method.ToString(),
        order.Payment.Status.ToString(),
        order.Payment.TransactionId,
        order.Payment.PaidAt,
        order.Delivery.Address.Street,
        order.Delivery.Address.City,
        order.Delivery.Address.District,
        order.Delivery.Address.PostalCode,
        order.Delivery.Address.Country,
        order.Delivery.Instructions,
        order.Notes.CustomerNotes,
        order.Notes.MerchantNotes,
        order.Items.Select(i => new OrderItemDto(
            i.Id.Value,
            i.ProductId.Value,
            i.ProductName,
            i.UnitPrice.Amount,
            i.Quantity,
            i.Total.Amount
        )).ToList(),
        order.StatusHistory.Select(s => new OrderStatusChangeDto(
            s.FromStatus.ToString(),
            s.ToStatus.ToString(),
            s.ChangedAt,
            s.Notes
        )).ToList(),
        order.CreatedAt,
        order.UpdatedAt
    );
}
