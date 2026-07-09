using MediatR;
using Microsoft.Extensions.Logging;
using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Ordering.Aggregates.Order.Events;

namespace Qaflaty.Application.Ads.EventHandlers;

/// <summary>
/// Fires the server-side Purchase event whenever an order is confirmed — the single
/// canonical trigger regardless of the OTP or non-OTP checkout path (see
/// docs/ADS_MANAGEMENT.md, §13). The dedup <c>EventKey</c> is derived deterministically
/// from the OrderId, so this handler is safe to run more than once for the same order
/// (e.g. a MediatR retry) without ever producing two Purchase events at a provider.
/// </summary>
public class OrderPlacedTrackingHandler : INotificationHandler<OrderPlacedEvent>
{
    private readonly IStoreRepository _storeRepository;
    private readonly IEventDispatcher _eventDispatcher;
    private readonly ILogger<OrderPlacedTrackingHandler> _logger;

    public OrderPlacedTrackingHandler(
        IStoreRepository storeRepository,
        IEventDispatcher eventDispatcher,
        ILogger<OrderPlacedTrackingHandler> logger)
    {
        _storeRepository = storeRepository;
        _eventDispatcher = eventDispatcher;
        _logger = logger;
    }

    public async Task Handle(OrderPlacedEvent notification, CancellationToken cancellationToken)
    {
        var store = await _storeRepository.GetByIdAsync(notification.StoreId, cancellationToken);
        if (store == null)
        {
            _logger.LogWarning("Store {StoreId} not found when tracking Purchase for Order {OrderId}",
                notification.StoreId.Value, notification.OrderId.Value);
            return;
        }

        var payload = new TrackingEventPayload(
            notification.StoreId,
            notification.OrderId.Value, // deterministic event key: one order -> one Purchase event, forever
            TrackingEventType.Purchase,
            TrackingChannel.Server,
            DateTime.UtcNow,
            notification.OrderId,
            CustomerRef: notification.CustomerId.Value.ToString(),
            Value: notification.Total.Amount,
            Currency: store.Currency.Code,
            Contents: notification.Items
                .Select(i => new TrackingContentItem(i.ProductId.Value.ToString(), i.Quantity, null))
                .ToList(),
            PageUrl: null,
            ClientIpAddress: null,
            ClientUserAgent: null,
            CustomerEmail: null,
            CustomerPhone: null);

        await _eventDispatcher.DispatchAsync(payload, cancellationToken);
    }
}
