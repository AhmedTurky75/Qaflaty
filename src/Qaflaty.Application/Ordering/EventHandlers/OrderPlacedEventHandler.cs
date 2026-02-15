using MediatR;
using Microsoft.Extensions.Logging;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Ordering.Aggregates.Order.Events;

namespace Qaflaty.Application.Ordering.EventHandlers;

public class OrderPlacedEventHandler : INotificationHandler<OrderPlacedEvent>
{
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<OrderPlacedEventHandler> _logger;

    public OrderPlacedEventHandler(
        IProductRepository productRepository,
        IUnitOfWork unitOfWork,
        ILogger<OrderPlacedEventHandler> logger)
    {
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task Handle(OrderPlacedEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Handling OrderPlacedEvent for Order {OrderId} in Store {StoreId}. Reducing stock for {ItemCount} items",
            notification.OrderId.Value,
            notification.StoreId.Value,
            notification.Items.Count);

        foreach (var item in notification.Items)
        {
            var product = await _productRepository.GetByIdAsync(item.ProductId, cancellationToken);
            if (product == null)
            {
                _logger.LogWarning(
                    "Product {ProductId} not found when reducing stock for Order {OrderId}",
                    item.ProductId.Value,
                    notification.OrderId.Value);
                continue;
            }

            var reserveResult = product.ReserveStock(item.Quantity);
            if (reserveResult.IsFailure)
            {
                _logger.LogWarning(
                    "Failed to reserve stock for Product {ProductId}: {Error}",
                    item.ProductId.Value,
                    reserveResult.Error.Message);
                continue;
            }
            _productRepository.Update(product);

            _logger.LogInformation(
                "Reduced stock for Product {ProductId} by {Quantity}",
                item.ProductId.Value,
                item.Quantity);
        }

        // IMPORTANT: Save changes to persist stock reductions
        // Event handlers are NOT wrapped by UnitOfWorkBehavior, so we must save manually
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
