using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Aggregates.Customer;
using Qaflaty.Domain.Ordering.Aggregates.Order;
using Qaflaty.Domain.Ordering.Enums;
using Qaflaty.Domain.Ordering.Errors;
using Qaflaty.Domain.Ordering.Repositories;
using Qaflaty.Domain.Ordering.ValueObjects;

namespace Qaflaty.Application.Ordering.Commands.VerifyOrderOtp;

public class VerifyOrderOtpCommandHandler : ICommandHandler<VerifyOrderOtpCommand, OrderDto>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IOrderOtpRepository _otpRepository;
    private readonly ICustomerRepository _customerRepository;

    public VerifyOrderOtpCommandHandler(
        IOrderRepository orderRepository,
        IOrderOtpRepository otpRepository,
        ICustomerRepository customerRepository)
    {
        _orderRepository = orderRepository;
        _otpRepository = otpRepository;
        _customerRepository = customerRepository;
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
            //_otpRepository.Update(otp);
            return Result.Failure<OrderDto>(OrderingErrors.OtpExpired);
        }

        if (otp.IsMaxAttemptsReached())
            return Result.Failure<OrderDto>(OrderingErrors.OtpMaxAttemptsReached);

        var isValid = otp.Verify(request.OtpCode);
        //_otpRepository.Update(otp);

        if (!isValid)
        {
            if (otp.IsMaxAttemptsReached())
                return Result.Failure<OrderDto>(OrderingErrors.OtpMaxAttemptsReached);

            return Result.Failure<OrderDto>(OrderingErrors.OtpInvalid);
        }

        var confirmResult = order.Confirm();
        if (confirmResult.IsFailure)
            return Result.Failure<OrderDto>(confirmResult.Error);

        //_orderRepository.Update(order);

        var customer = await _customerRepository.GetByIdAsync(order.CustomerId, cancellationToken);
        var customerSnapshot = customer != null
            ? new CustomerSnapshotDto(
                customer.Contact.FullName.FullName,
                customer.Contact.Phone.Value,
                customer.Contact.Email?.Value)
            : new CustomerSnapshotDto("Unknown", "-", null);

        return Result.Success(MapToDto(order, customerSnapshot));
    }

    private static OrderDto MapToDto(Order order, CustomerSnapshotDto customerSnapshot) => new(
        order.Id.Value,
        order.StoreId.Value,
        order.CustomerId.Value,
        order.OrderNumber.Value,
        order.Status.ToString(),
        customerSnapshot,
        order.Items.Select(i => new OrderItemDto(
            i.Id.Value,
            i.ProductId.Value,
            i.ProductName,
            new MoneyDto(i.UnitPrice.Amount, i.UnitPrice.Currency.ToString()),
            i.Quantity,
            new MoneyDto(i.Total.Amount, i.Total.Currency.ToString())
        )).ToList(),
        new OrderPricingDto(
            new MoneyDto(order.Pricing.Subtotal.Amount, order.Pricing.Subtotal.Currency.ToString()),
            new MoneyDto(order.Pricing.DeliveryFee.Amount, order.Pricing.DeliveryFee.Currency.ToString()),
            new MoneyDto(order.Pricing.Total.Amount, order.Pricing.Total.Currency.ToString()),
            new MoneyDto(order.Pricing.DiscountAmount.Amount, order.Pricing.DiscountAmount.Currency.ToString()),
            new MoneyDto(order.Pricing.TaxAmount.Amount, order.Pricing.TaxAmount.Currency.ToString())
        ),
        new PaymentInfoDto(
            order.Payment.Method.ToString(),
            order.Payment.Status.ToString(),
            order.Payment.TransactionId,
            order.Payment.PaidAt,
            order.Payment.FailureReason
        ),
        new DeliveryInfoDto(
            new AddressDto(
                order.Delivery.Address.Street,
                order.Delivery.Address.City,
                order.Delivery.Address.District,
                order.Delivery.Address.PostalCode,
                order.Delivery.Address.Country,
                order.Delivery.Address.AdditionalInfo
            ),
            order.Delivery.Instructions
        ),
        new OrderNotesDto(order.Notes.CustomerNotes, order.Notes.MerchantNotes),
        order.StatusHistory.Select(s => new OrderStatusChangeDto(
            s.Id,
            s.FromStatus.ToString(),
            s.ToStatus.ToString(),
            s.ChangedAt,
            s.ChangedBy,
            s.Notes
        )).ToList(),
        order.CreatedAt,
        order.UpdatedAt,
        OrderSource.Storefront.ToString(),
        order.AppliedPromoCode
    );
}
