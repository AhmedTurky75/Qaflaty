using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.ValueObjects;
using Qaflaty.Domain.Ordering.Aggregates.Customer;
using Qaflaty.Domain.Ordering.Aggregates.Order;
using Qaflaty.Domain.Ordering.Enums;
using Qaflaty.Domain.Ordering.Repositories;
using Qaflaty.Domain.Ordering.Services;
using Qaflaty.Domain.Ordering.ValueObjects;
using Qaflaty.Domain.Catalog.Repositories;

namespace Qaflaty.Application.Ordering.Commands.PlaceOrder;

public class PlaceOrderCommandHandler : ICommandHandler<PlaceOrderCommand, OrderDto>
{
    private readonly IOrderRepository _orderRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly IOrderNumberGenerator _orderNumberGenerator;

    public PlaceOrderCommandHandler(
        IOrderRepository orderRepository,
        ICustomerRepository customerRepository,
        IStoreRepository storeRepository,
        IOrderNumberGenerator orderNumberGenerator)
    {
        _orderRepository = orderRepository;
        _customerRepository = customerRepository;
        _storeRepository = storeRepository;
        _orderNumberGenerator = orderNumberGenerator;
    }

    public async Task<Result<OrderDto>> Handle(PlaceOrderCommand request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        // Verify store exists
        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null)
            return Result.Failure<OrderDto>(new Error("Order.StoreNotFound", "Store not found"));

        // Create customer contact value objects
        var nameResult = PersonName.Create(request.CustomerName);
        if (nameResult.IsFailure)
            return Result.Failure<OrderDto>(nameResult.Error);

        var phoneResult = PhoneNumber.Create(request.CustomerPhone);
        if (phoneResult.IsFailure)
            return Result.Failure<OrderDto>(phoneResult.Error);

        Email? email = null;
        if (!string.IsNullOrWhiteSpace(request.CustomerEmail))
        {
            var emailResult = Email.Create(request.CustomerEmail);
            if (emailResult.IsFailure)
                return Result.Failure<OrderDto>(emailResult.Error);
            email = emailResult.Value;
        }

        var contact = CustomerContact.Create(nameResult.Value, phoneResult.Value, email);

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

        // Create order
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

        // Confirm order immediately (moves to Confirmed and raises OrderPlacedEvent)
        var confirmResult = order.Confirm();
        if (confirmResult.IsFailure)
            return Result.Failure<OrderDto>(confirmResult.Error);

        await _orderRepository.AddAsync(order, cancellationToken);

        return Result.Success(MapToDto(order, customer));
    }

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
