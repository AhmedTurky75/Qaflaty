using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Exceptions;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Repositories;
using Qaflaty.Domain.Ordering.ValueObjects;

namespace Qaflaty.Application.Ordering.Queries.TrackOrder;

public class TrackOrderQueryHandler : IQueryHandler<TrackOrderQuery, OrderTrackingDto>
{
    private readonly IOrderRepository _orderRepository;

    public TrackOrderQueryHandler(IOrderRepository orderRepository)
    {
        _orderRepository = orderRepository;
    }

    public async Task<OrderTrackingDto> Handle(TrackOrderQuery request, CancellationToken cancellationToken)
    {
        var orderNumberResult = OrderNumber.Parse(request.OrderNumber);
        if (orderNumberResult.IsFailure)
            throw new NotFoundException("Order", request.OrderNumber);

        var storeId = new StoreId(request.StoreId);
        var order = await _orderRepository.GetByOrderNumberAsync(storeId, orderNumberResult.Value, cancellationToken);
        if (order == null)
            throw new NotFoundException("Order", request.OrderNumber);

        return new OrderTrackingDto(
            order.OrderNumber.Value,
            order.Status.ToString(),
            order.Pricing.Total.Amount,
            order.Payment.Method.ToString(),
            order.Payment.Status.ToString(),
            order.StatusHistory.Select(s => new OrderStatusChangeDto(
                s.FromStatus.ToString(),
                s.ToStatus.ToString(),
                s.ChangedAt,
                s.Notes
            )).ToList(),
            order.CreatedAt
        );
    }
}
