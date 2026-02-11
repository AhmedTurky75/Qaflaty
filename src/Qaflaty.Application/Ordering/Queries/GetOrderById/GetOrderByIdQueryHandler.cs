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
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetOrderByIdQueryHandler(
        IOrderRepository orderRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _orderRepository = orderRepository;
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
        if (store == null || store.MerchantId.Value != _currentUserService.MerchantId?.Value)
            return Result.Failure<OrderDto>(Error.Unauthorized);

        return Result.Success(new OrderDto(
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
        ));
    }
}
