using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Ordering.Errors;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Ordering.Queries.GetOrderById;

public class GetOrderByIdQueryHandler : IQueryHandler<GetOrderByIdQuery, OrderDto>
{
    private readonly IOrderRepository _orderRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetOrderByIdQueryHandler(
        IOrderRepository orderRepository,
        ICustomerRepository customerRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _orderRepository = orderRepository;
        _customerRepository = customerRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<OrderDto>> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var orderId = new OrderId(request.OrderId);
        var order = await _orderRepository.GetByIdAsync(orderId, cancellationToken);
        if (order == null)
            return Result.Failure<OrderDto>(OrderingErrors.OrderNotFound);

        var store = await _storeRepository.GetByIdAsync(order.StoreId, cancellationToken);
        if (store == null ||
            !await _storeRepository.CanMerchantAccessStoreAsync(
                _currentUserService.MerchantId ?? default, store.Id, cancellationToken))
            return Result.Failure<OrderDto>(Error.Unauthorized);

        var customer = await _customerRepository.GetByIdAsync(order.CustomerId, cancellationToken);
        var customerSnapshot = customer != null
            ? new CustomerSnapshotDto(
                customer.Contact.FullName.FullName,
                customer.Contact.Phone.Value,
                customer.Contact.Email?.Value)
            : new CustomerSnapshotDto("Unknown", "-", null);

        return Result.Success(new OrderDto(
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
                new MoneyDto(i.UnitPrice.Amount, store.Currency.Code),
                i.Quantity,
                new MoneyDto(i.Total.Amount, store.Currency.Code)
            )).ToList(),
            new OrderPricingDto(
                new MoneyDto(order.Pricing.Subtotal.Amount, store.Currency.Code),
                new MoneyDto(order.Pricing.DeliveryFee.Amount, store.Currency.Code),
                new MoneyDto(order.Pricing.Total.Amount, store.Currency.Code),
                new MoneyDto(order.Pricing.DiscountAmount.Amount, store.Currency.Code),
                new MoneyDto(order.Pricing.TaxAmount.Amount, store.Currency.Code)
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
            order.AppliedPromoCode,
            order.Shipment is null
                ? null
                : new ShipmentDto(
                    order.Shipment.Carrier,
                    order.Shipment.TrackingNumber,
                    order.Shipment.TrackingUrl,
                    order.Shipment.ShippedAt,
                    order.Shipment.EstimatedDeliveryDate)
        ));
    }
}
