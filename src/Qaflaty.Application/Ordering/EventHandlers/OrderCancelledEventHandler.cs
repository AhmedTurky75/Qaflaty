using MediatR;
using Microsoft.Extensions.Logging;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Ordering.Repositories;
using Qaflaty.Domain.Ordering.Aggregates.Order.Events;

namespace Qaflaty.Application.Ordering.EventHandlers;

public class OrderCancelledEventHandler : INotificationHandler<OrderCancelledEvent>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IProductRepository _productRepository;
    private readonly ILogger<OrderCancelledEventHandler> _logger;

    public OrderCancelledEventHandler(
        IOrderRepository orderRepository,
        IProductRepository productRepository,
        ILogger<OrderCancelledEventHandler> logger)
    {
        _orderRepository = orderRepository;
        _productRepository = productRepository;
        _logger = logger;
    }

    public async Task Handle(OrderCancelledEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Handling OrderCancelledEvent for Order {OrderId}. Reason: {Reason}. Restoring stock",
            notification.OrderId.Value,
            notification.Reason);

        var order = await _orderRepository.GetByIdAsync(notification.OrderId, cancellationToken);
        if (order == null)
        {
            _logger.LogWarning("Order {OrderId} not found when restoring stock", notification.OrderId.Value);
            return;
        }

        foreach (var item in order.Items)
        {
            var product = await _productRepository.GetByIdAsync(item.ProductId, cancellationToken);
            if (product == null)
            {
                _logger.LogWarning(
                    "Product {ProductId} not found when restoring stock for Order {OrderId}",
                    item.ProductId.Value,
                    notification.OrderId.Value);
                continue;
            }

            var restoreResult = product.RestoreStock(item.Quantity);
            if (restoreResult.IsFailure)
            {
                _logger.LogWarning(
                    "Failed to restore stock for Product {ProductId}: {Error}",
                    item.ProductId.Value,
                    restoreResult.Error.Message);
                continue;
            }
            _productRepository.Update(product);

            _logger.LogInformation(
                "Restored stock for Product {ProductId} by {Quantity}",
                item.ProductId.Value,
                item.Quantity);
        }
    }
}
