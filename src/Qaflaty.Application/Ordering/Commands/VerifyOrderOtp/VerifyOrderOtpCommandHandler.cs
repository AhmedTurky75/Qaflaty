using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.Common;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Application.Storefront.Common;
using Qaflaty.Domain.Catalog.Repositories;
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
    private readonly IStoreRepository _storeRepository;
    private readonly ICartConversionService _cartConversionService;

    public VerifyOrderOtpCommandHandler(
        IOrderRepository orderRepository,
        IOrderOtpRepository otpRepository,
        ICustomerRepository customerRepository,
        IStoreRepository storeRepository,
        ICartConversionService cartConversionService)
    {
        _orderRepository = orderRepository;
        _otpRepository = otpRepository;
        _customerRepository = customerRepository;
        _storeRepository = storeRepository;
        _cartConversionService = cartConversionService;
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

        // The code was correct, so from the customer's side the order is verified either way. An
        // order flagged against the phone blocklist at placement parks in Blocked rather than
        // confirming, so the merchant decides before any stock is reserved or Purchase is tracked.
        var settleResult = string.IsNullOrWhiteSpace(order.BlockReason)
            ? order.Confirm("Customer")
            : order.MarkBlocked("System");

        if (settleResult.IsFailure)
            return Result.Failure<OrderDto>(settleResult.Error);

        //_orderRepository.Update(order);

        // The cart survived checkout while OTP was pending — now that the order is actually
        // confirmed, stop showing it as active to the merchant.
        await _cartConversionService.ConvertCartAsync(
            storeId, request.BuyerCustomerId, request.BuyerGuestId, cancellationToken);

        var customer = await _customerRepository.GetByIdAsync(order.CustomerId, cancellationToken);
        var customerSnapshot = customer != null
            ? new CustomerSnapshotDto(
                customer.Contact.FullName.FullName,
                customer.Contact.Phone.Value,
                customer.Contact.Email?.Value)
            : new CustomerSnapshotDto("Unknown", "-", null);

        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        var currencyCode = store?.Currency.Code ?? "EGP";

        return Result.Success(MapToDto(order, customerSnapshot, currencyCode));
    }

    private static OrderDto MapToDto(Order order, CustomerSnapshotDto customerSnapshot, string currencyCode) => new(
        order.Id.Value,
        order.StoreId.Value,
        order.CustomerId.Value,
        order.OrderNumber.Value,
        CustomerFacingOrderStatus.Map(order.Status),
        customerSnapshot,
        order.Items.Select(i => new OrderItemDto(
            i.Id.Value,
            i.ProductId.Value,
            i.ProductName,
            new MoneyDto(i.UnitPrice.Amount, currencyCode),
            i.Quantity,
            new MoneyDto(i.Total.Amount, currencyCode)
        )).ToList(),
        new OrderPricingDto(
            new MoneyDto(order.Pricing.Subtotal.Amount, currencyCode),
            new MoneyDto(order.Pricing.DeliveryFee.Amount, currencyCode),
            new MoneyDto(order.Pricing.Total.Amount, currencyCode),
            new MoneyDto(order.Pricing.DiscountAmount.Amount, currencyCode),
            new MoneyDto(order.Pricing.TaxAmount.Amount, currencyCode)
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
        order.StatusHistory.Where(CustomerFacingOrderStatus.IsVisibleToCustomer).Select(s => new OrderStatusChangeDto(
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
