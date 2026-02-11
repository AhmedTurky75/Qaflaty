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

    public TrackOrderQueryHandler(IOrderRepository orderRepository)
    {
        _orderRepository = orderRepository;
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

        return Result.Success(new OrderTrackingDto(
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
        ));
    }
}
