using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.ValueObjects;
using Qaflaty.Domain.Ordering.Aggregates.Customer;
using Qaflaty.Domain.Ordering.Aggregates.Order;
using Qaflaty.Domain.Ordering.Errors;
using Qaflaty.Domain.Ordering.Enums;
using Qaflaty.Domain.Ordering.Repositories;
using Qaflaty.Domain.Ordering.Services;
using Qaflaty.Domain.Ordering.ValueObjects;

namespace Qaflaty.Application.Ordering.Commands.PlaceOrder;

public class PlaceOrderCommandHandler : ICommandHandler<PlaceOrderCommand, OrderDto>
{
    private readonly IOrderRepository _orderRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly IOrderNumberGenerator _orderNumberGenerator;
    private readonly IOrderOtpRepository _otpRepository;
    private readonly IEmailService _emailService;

    public PlaceOrderCommandHandler(
        IOrderRepository orderRepository,
        ICustomerRepository customerRepository,
        IStoreRepository storeRepository,
        IOrderNumberGenerator orderNumberGenerator,
        IOrderOtpRepository otpRepository,
        IEmailService emailService)
    {
        _orderRepository = orderRepository;
        _customerRepository = customerRepository;
        _storeRepository = storeRepository;
        _orderNumberGenerator = orderNumberGenerator;
        _otpRepository = otpRepository;
        _emailService = emailService;
    }

    public async Task<Result<OrderDto>> Handle(PlaceOrderCommand request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        // Verify store exists
        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null)
            return Result.Failure<OrderDto>(new Error("Order.StoreNotFound", "Store not found"));

        // Validate email is present (required for OTP verification)
        if (string.IsNullOrWhiteSpace(request.CustomerEmail))
            return Result.Failure<OrderDto>(OrderingErrors.EmailRequired);

        var emailResult = Email.Create(request.CustomerEmail);
        if (emailResult.IsFailure)
            return Result.Failure<OrderDto>(emailResult.Error);

        // Create customer contact value objects
        var nameResult = PersonName.Create(request.CustomerName);
        if (nameResult.IsFailure)
            return Result.Failure<OrderDto>(nameResult.Error);

        var phoneResult = PhoneNumber.Create(request.CustomerPhone);
        if (phoneResult.IsFailure)
            return Result.Failure<OrderDto>(phoneResult.Error);

        var contact = CustomerContact.Create(nameResult.Value, phoneResult.Value, emailResult.Value);

        // Create address
        var addressResult = Address.Create(
            request.Street,
            request.City,
            request.District,
            request.PostalCode,
            request.Country);

        if (addressResult.IsFailure)
            return Result.Failure<OrderDto>(addressResult.Error);

        // Find or create customer
        var existingCustomer = await _customerRepository.GetByPhoneAsync(storeId, phoneResult.Value, cancellationToken);
        Customer customer;

        if (existingCustomer != null)
        {
            existingCustomer.UpdateContact(contact);
            existingCustomer.UpdateAddress(addressResult.Value);
            _customerRepository.Update(existingCustomer);
            customer = existingCustomer;
        }
        else
        {
            var customerResult = Customer.Create(storeId, contact, addressResult.Value);
            if (customerResult.IsFailure)
                return Result.Failure<OrderDto>(customerResult.Error);

            customer = customerResult.Value;
            await _customerRepository.AddAsync(customer, cancellationToken);
        }

        // Parse payment method
        if (!Enum.TryParse<PaymentMethod>(request.PaymentMethod, out var paymentMethod))
            return Result.Failure<OrderDto>(new Error("Order.InvalidPaymentMethod", "Invalid payment method"));

        // Generate order number
        var orderNumber = await _orderNumberGenerator.GenerateAsync(storeId, cancellationToken);

        // Get delivery fee from store
        var deliveryFee = store.DeliverySettings.DeliveryFee;

        // Create delivery info
        var deliveryInfo = DeliveryInfo.Create(addressResult.Value, request.DeliveryInstructions);

        // Create order (stays in Pending until OTP is verified)
        var orderResult = Order.Create(
            storeId,
            customer.Id,
            orderNumber,
            deliveryInfo,
            paymentMethod,
            deliveryFee,
            request.CustomerNotes);

        if (orderResult.IsFailure)
            return Result.Failure<OrderDto>(orderResult.Error);

        var order = orderResult.Value;

        // Add items
        foreach (var item in request.Items)
        {
            var priceResult = Money.Create(item.UnitPrice);
            if (priceResult.IsFailure)
                return Result.Failure<OrderDto>(priceResult.Error);

            var addResult = order.AddItem(
                new ProductId(item.ProductId),
                item.ProductName,
                priceResult.Value,
                item.Quantity);

            if (addResult.IsFailure)
                return Result.Failure<OrderDto>(addResult.Error);
        }

        await _orderRepository.AddAsync(order, cancellationToken);

        // Generate OTP and send confirmation email
        var otp = OrderOtp.Create(order.Id, emailResult.Value.Value);
        await _otpRepository.AddAsync(otp, cancellationToken);

        var storeName = store.Name.Value;
        var htmlBody = BuildOtpEmail(storeName, order.OrderNumber.Value, otp.Code);

        await _emailService.SendEmailAsync(
            to: emailResult.Value.Value,
            subject: $"Your order verification code - {order.OrderNumber.Value}",
            htmlBody: htmlBody,
            ct: cancellationToken);

        return Result.Success(MapToDto(order, customer));
    }

    private static string BuildOtpEmail(string storeName, string orderNumber, string otpCode) => $"""
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"><title>Order Verification</title></head>
        <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <tr><td style="background:#1a1a2e;padding:32px 40px;text-align:center;border-radius:8px 8px 0 0;">
                  <h1 style="margin:0;color:#fff;font-size:24px;">{storeName}</h1>
                </td></tr>
                <tr><td style="padding:40px;">
                  <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">Verify Your Order</h2>
                  <p style="margin:0 0 8px;color:#555;font-size:15px;">Thank you for your order <strong>{orderNumber}</strong>!</p>
                  <p style="margin:0 0 32px;color:#555;font-size:15px;">Enter the code below to confirm. It expires in <strong>{OrderOtp.ExpiryMinutes} minutes</strong>.</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr><td align="center" style="padding:24px;background:#f8f9fa;border-radius:8px;border:2px dashed #dee2e6;">
                      <p style="margin:0 0 8px;color:#6c757d;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Verification Code</p>
                      <p style="margin:0;color:#1a1a2e;font-size:48px;font-weight:700;letter-spacing:12px;font-family:'Courier New',monospace;">{otpCode}</p>
                    </td></tr>
                  </table>
                  <p style="margin:32px 0 0;color:#999;font-size:13px;">If you did not place this order, please ignore this email.</p>
                </td></tr>
                <tr><td style="padding:24px 40px;background:#f8f9fa;border-top:1px solid #e9ecef;text-align:center;border-radius:0 0 8px 8px;">
                  <p style="margin:0;color:#aaa;font-size:12px;">&copy; {DateTime.UtcNow.Year} {storeName}. All rights reserved.</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """;

    private static OrderDto MapToDto(Order order, Customer customer) => new(
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
