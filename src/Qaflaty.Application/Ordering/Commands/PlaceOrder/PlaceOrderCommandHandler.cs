using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Aggregates.PromoCode;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Repositories;
using OrderingPaymentMethod = Qaflaty.Domain.Ordering.Enums.PaymentMethod;
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
    private readonly IProductRepository _productRepository;
    private readonly IDeliveryZoneRepository _deliveryZoneRepository;
    private readonly IOrderNumberGenerator _orderNumberGenerator;
    private readonly IOrderOtpRepository _otpRepository;
    private readonly IEmailService _emailService;
    private readonly IOtpSettings _otpSettings;
    private readonly IStoreConfigurationRepository _storeConfigRepository;
    private readonly IPromoCodeRepository _promoCodeRepository;

    public PlaceOrderCommandHandler(
        IOrderRepository orderRepository,
        ICustomerRepository customerRepository,
        IStoreRepository storeRepository,
        IProductRepository productRepository,
        IDeliveryZoneRepository deliveryZoneRepository,
        IOrderNumberGenerator orderNumberGenerator,
        IOrderOtpRepository otpRepository,
        IEmailService emailService,
        IOtpSettings otpSettings,
        IStoreConfigurationRepository storeConfigRepository,
        IPromoCodeRepository promoCodeRepository)
    {
        _orderRepository = orderRepository;
        _customerRepository = customerRepository;
        _storeRepository = storeRepository;
        _productRepository = productRepository;
        _deliveryZoneRepository = deliveryZoneRepository;
        _orderNumberGenerator = orderNumberGenerator;
        _otpRepository = otpRepository;
        _emailService = emailService;
        _otpSettings = otpSettings;
        _storeConfigRepository = storeConfigRepository;
        _promoCodeRepository = promoCodeRepository;
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
        var nameResult = PersonName.CreateFromFullName(request.CustomerName);
        if (nameResult.IsFailure)
            return Result.Failure<OrderDto>(nameResult.Error);

        var phoneResult = PhoneNumber.Create(request.CustomerPhone, request.CustomerPhoneCountryCode);
        if (phoneResult.IsFailure)
            return Result.Failure<OrderDto>(phoneResult.Error);

        var contact = CustomerContact.Create(nameResult.Value, phoneResult.Value, emailResult.Value);

        // Create address
        var addressResult = Address.Create(
            request.Street,
            request.City,
            request.District);

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

        // Validate payment method key
        if (string.IsNullOrWhiteSpace(request.PaymentMethod))
            return Result.Failure<OrderDto>(new Error("Order.InvalidPaymentMethod", "Payment method is required"));

        var storeConfigForPayment = await _storeConfigRepository.GetByStoreIdAsync(storeId, cancellationToken);
        if (storeConfigForPayment != null && storeConfigForPayment.PaymentMethodAdjustments.Count > 0)
        {
            var adjustment = storeConfigForPayment.PaymentMethodAdjustments
                .FirstOrDefault(a => a.PaymentMethodKey.Equals(request.PaymentMethod, StringComparison.OrdinalIgnoreCase));
            if (adjustment != null && !adjustment.IsEnabled)
                return Result.Failure<OrderDto>(new Error("Order.PaymentMethodDisabled",
                    $"Payment method '{request.PaymentMethod}' is not available for this store"));
            if (adjustment == null)
                return Result.Failure<OrderDto>(new Error("Order.PaymentMethodNotConfigured",
                    $"Payment method '{request.PaymentMethod}' is not configured for this store"));
        }

        var paymentMethod = MapToOrderingPaymentMethod(request.PaymentMethod);

        // Generate order number
        var orderNumber = await _orderNumberGenerator.GenerateAsync(storeId, cancellationToken);

        // Resolve delivery fee from zones (district > city > country > store default)
        Money deliveryFee = store.DeliverySettings.DeliveryFee;
        if (request.CountryCode > 0)
        {
            if (request.DistrictId.HasValue)
            {
                var districtZone = await _deliveryZoneRepository.GetZoneAsync(
                    storeId, DeliveryZoneLevel.District, request.DistrictId.Value, cancellationToken);
                if (districtZone != null)
                {
                    if (!districtZone.IsDeliveryEnabled)
                        return Result.Failure<OrderDto>(new Error("Order.DeliveryNotAvailable",
                            "Delivery is not available to your selected district"));
                    if (districtZone.CustomDeliveryFee.HasValue)
                        deliveryFee = Money.Create(districtZone.CustomDeliveryFee.Value).Value;
                }
            }

            if (deliveryFee == store.DeliverySettings.DeliveryFee && request.CityId.HasValue)
            {
                var cityZone = await _deliveryZoneRepository.GetZoneAsync(
                    storeId, DeliveryZoneLevel.City, request.CityId.Value, cancellationToken);
                if (cityZone != null)
                {
                    if (!cityZone.IsDeliveryEnabled)
                        return Result.Failure<OrderDto>(new Error("Order.DeliveryNotAvailable",
                            "Delivery is not available to your selected city"));
                    if (cityZone.CustomDeliveryFee.HasValue)
                        deliveryFee = Money.Create(cityZone.CustomDeliveryFee.Value).Value;
                }
            }

            if (deliveryFee == store.DeliverySettings.DeliveryFee)
            {
                var countryZone = await _deliveryZoneRepository.GetZoneAsync(
                    storeId, DeliveryZoneLevel.Country, request.CountryCode, cancellationToken);
                if (countryZone != null)
                {
                    if (!countryZone.IsDeliveryEnabled)
                        return Result.Failure<OrderDto>(new Error("Order.DeliveryNotAvailable",
                            "Delivery is not available to your country"));
                    if (countryZone.CustomDeliveryFee.HasValue)
                        deliveryFee = Money.Create(countryZone.CustomDeliveryFee.Value).Value;
                }
            }
        }

        // Create delivery info
        var deliveryInfo = DeliveryInfo.Create(addressResult.Value, request.DeliveryInstructions);

        // Resolve the store's tax configuration (applied to the order pricing).
        var taxSettings = storeConfigForPayment?.TaxSettings;
        var taxRate = taxSettings?.EffectiveRate ?? 0m;
        var pricesIncludeTax = taxSettings?.PricesIncludeTax ?? false;

        // Create order (stays in Pending until OTP is verified)
        var orderResult = Order.Create(
            storeId,
            customer.Id,
            orderNumber,
            deliveryInfo,
            paymentMethod,
            deliveryFee,
            request.CustomerNotes,
            request.Source,
            taxRate,
            pricesIncludeTax);

        if (orderResult.IsFailure)
            return Result.Failure<OrderDto>(orderResult.Error);

        var order = orderResult.Value;

        // Add items — name and price are resolved server-side from the catalog
        foreach (var item in request.Items)
        {
            var product = await _productRepository.GetByIdAsync(new ProductId(item.ProductId), cancellationToken);
            if (product == null || product.StoreId != storeId)
                return Result.Failure<OrderDto>(new Error("Order.ProductNotFound",
                    $"Product {item.ProductId} not found"));

            // Use variant price override when a variant is specified; otherwise use base product price
            Money unitPrice = product.Pricing.Price;
            if (item.VariantId.HasValue)
            {
                var variant = product.GetVariant(item.VariantId.Value);
                if (variant == null)
                    return Result.Failure<OrderDto>(new Error("Order.VariantNotFound",
                        $"Variant {item.VariantId} not found for product {item.ProductId}"));

                unitPrice = variant.PriceOverride ?? product.Pricing.Price;
            }

            var addResult = order.AddItem(
                new ProductId(item.ProductId),
                product.Name.Value,
                unitPrice,
                item.Quantity);

            if (addResult.IsFailure)
                return Result.Failure<OrderDto>(addResult.Error);
        }

        // Apply a promo code if one was supplied. Validation and discount calculation are owned by
        // the PromoCode aggregate so the rules cannot be bypassed here.
        if (!string.IsNullOrWhiteSpace(request.PromoCode))
        {
            var promo = await _promoCodeRepository.GetByCodeAsync(storeId, request.PromoCode, cancellationToken);
            if (promo == null)
                return Result.Failure<OrderDto>(new Error("PromoCode.NotFound", "Promo code not found"));

            var customerRedemptions = await _promoCodeRepository.CountCustomerRedemptionsAsync(
                promo.Id, customer.Id, cancellationToken);

            var subtotal = order.Pricing.Subtotal.Amount;
            var validation = promo.Validate(subtotal, DateTime.UtcNow, customerRedemptions);
            if (validation.IsFailure)
                return Result.Failure<OrderDto>(validation.Error);

            var discountValue = promo.CalculateDiscount(subtotal, deliveryFee.Amount);
            var discountResult = Money.Create(discountValue);
            if (discountResult.IsFailure)
                return Result.Failure<OrderDto>(discountResult.Error);

            var applyResult = order.ApplyDiscount(promo.Code, discountResult.Value);
            if (applyResult.IsFailure)
                return Result.Failure<OrderDto>(applyResult.Error);

            promo.RecordRedemption();
            _promoCodeRepository.Update(promo);

            var redemption = PromoCodeRedemption.Create(
                promo.Id, storeId, order.Id, customer.Id, promo.Code, discountValue);
            await _promoCodeRepository.AddRedemptionAsync(redemption, cancellationToken);
        }

        await _orderRepository.AddAsync(order, cancellationToken);

        // Re-use already-fetched config (or re-fetch if it was null above)
        var storeConfig = storeConfigForPayment ?? await _storeConfigRepository.GetByStoreIdAsync(storeId, cancellationToken);
        var requireOtp = storeConfig?.CustomerAuthSettings.RequireOtpOnPlaceOrder ?? false;

        if (requireOtp)
        {
            // Generate OTP and send confirmation email — order stays Pending until verified
            var otp = OrderOtp.Create(order.Id, emailResult.Value.Value, _otpSettings.MockCode);
            await _otpRepository.AddAsync(otp, cancellationToken);

            var storeName = store.Name.Value;
            var htmlBody = BuildOtpEmail(storeName, order.OrderNumber.Value, otp.Code);

            await _emailService.SendEmailAsync(
                to: emailResult.Value.Value,
                subject: $"Your order verification code - {order.OrderNumber.Value}",
                htmlBody: htmlBody,
                ct: cancellationToken);
        }
        else
        {
            // OTP not required — confirm the order immediately
            order.Confirm("Customer");
        }

        return Result.Success(MapToDto(order, customer, store.Currency.Code));
    }

    private static OrderingPaymentMethod MapToOrderingPaymentMethod(string key) =>
        key.ToUpperInvariant() switch
        {
            "COD" => OrderingPaymentMethod.CashOnDelivery,
            "APPLEPAY" => OrderingPaymentMethod.Wallet,
            "STCPAY" => OrderingPaymentMethod.Wallet,
            _ => OrderingPaymentMethod.Card
        };

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

    private static OrderDto MapToDto(Order order, Customer customer, string currencyCode) => new(
        order.Id.Value,
        order.StoreId.Value,
        order.CustomerId.Value,
        order.OrderNumber.Value,
        order.Status.ToString(),
        new CustomerSnapshotDto(
            customer.Contact.FullName.FullName,
            customer.Contact.Phone.Value,
            customer.Contact.Email?.Value),
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
        order.Source.ToString(),
        order.AppliedPromoCode
    );
}
