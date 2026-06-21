using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Errors;
using Qaflaty.Domain.Ordering.Repositories;
using Qaflaty.Domain.Ordering.ValueObjects;

namespace Qaflaty.Application.Ordering.Queries.TrackOrder;

public class TrackOrderQueryHandler : IQueryHandler<TrackOrderQuery, OrderTrackingDto>
{
    private readonly IOrderRepository _orderRepository;
    private readonly ICustomerRepository _customerRepository;

    public TrackOrderQueryHandler(
        IOrderRepository orderRepository,
        ICustomerRepository customerRepository)
    {
        _orderRepository = orderRepository;
        _customerRepository = customerRepository;
    }

    public async Task<Result<OrderTrackingDto>> Handle(TrackOrderQuery request, CancellationToken cancellationToken)
    {
        var orderNumberResult = OrderNumber.Parse(request.OrderNumber);
        if (orderNumberResult.IsFailure)
            return Result.Failure<OrderTrackingDto>(OrderingErrors.OrderNotFound);

        var storeId = new StoreId(request.StoreId);
        var order = await _orderRepository.GetByOrderNumberAsync(storeId, orderNumberResult.Value, cancellationToken);
        if (order == null)
            return Result.Failure<OrderTrackingDto>(OrderingErrors.OrderNotFound);

        // A guessable order number is not proof of ownership: require the email or phone captured on
        // the order. A mismatch returns the same "not found" so existence can't be probed.
        var customer = await _customerRepository.GetByIdAsync(order.CustomerId, cancellationToken);
        if (customer == null || !ContactMatches(customer.Contact, request.Contact))
            return Result.Failure<OrderTrackingDto>(OrderingErrors.OrderNotFound);

        return Result.Success(new OrderTrackingDto(
            order.OrderNumber.Value,
            order.Status.ToString(),
            order.Items.Select(i => new TrackOrderItemDto(
                i.ProductName,
                new MoneyDto(i.UnitPrice.Amount, i.UnitPrice.Currency.ToString()),
                i.Quantity,
                new MoneyDto(i.Total.Amount, i.Total.Currency.ToString())
            )).ToList(),
            new OrderPricingDto(
                new MoneyDto(order.Pricing.Subtotal.Amount, order.Pricing.Subtotal.Currency.ToString()),
                new MoneyDto(order.Pricing.DeliveryFee.Amount, order.Pricing.DeliveryFee.Currency.ToString()),
                new MoneyDto(order.Pricing.Total.Amount, order.Pricing.Total.Currency.ToString()),
                new MoneyDto(order.Pricing.DiscountAmount.Amount, order.Pricing.DiscountAmount.Currency.ToString())
            ),
            new TrackOrderDeliveryDto(
                order.Delivery.Address.ToSingleLine(),
                order.Delivery.Instructions
            ),
            new TrackOrderPaymentDto(
                order.Payment.Method.ToString(),
                order.Payment.Status.ToString()
            ),
            order.StatusHistory.Select(s => new OrderStatusChangeDto(
                s.Id,
                s.FromStatus.ToString(),
                s.ToStatus.ToString(),
                s.ChangedAt,
                s.ChangedBy,
                s.Notes
            )).ToList(),
            order.CreatedAt,
            order.UpdatedAt
        ));
    }

    /// <summary>
    /// True when the supplied value matches the order's captured email (case-insensitive) or phone
    /// (compared on digits only, tolerating country-code/formatting differences).
    /// </summary>
    private static bool ContactMatches(CustomerContact contact, string? provided)
    {
        if (string.IsNullOrWhiteSpace(provided))
            return false;

        provided = provided.Trim();

        if (contact.Email != null &&
            string.Equals(contact.Email.Value, provided, StringComparison.OrdinalIgnoreCase))
            return true;

        var providedDigits = DigitsOnly(provided);
        var phoneDigits = DigitsOnly(contact.Phone.Value);
        if (providedDigits.Length >= 6 &&
            (phoneDigits == providedDigits ||
             phoneDigits.EndsWith(providedDigits, StringComparison.Ordinal) ||
             providedDigits.EndsWith(phoneDigits, StringComparison.Ordinal)))
            return true;

        return false;
    }

    private static string DigitsOnly(string value)
        => new(value.Where(char.IsDigit).ToArray());
}
