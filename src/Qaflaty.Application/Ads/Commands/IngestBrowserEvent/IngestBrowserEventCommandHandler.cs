using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Ads.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using TrackingEventAggregate = Qaflaty.Domain.Ads.Aggregates.TrackingEvent.TrackingEvent;

namespace Qaflaty.Application.Ads.Commands.IngestBrowserEvent;

public class IngestBrowserEventCommandHandler : ICommandHandler<IngestBrowserEventCommand>
{
    private readonly ITrackingEventRepository _trackingEventRepository;
    private readonly IEventDispatcher _eventDispatcher;

    public IngestBrowserEventCommandHandler(
        ITrackingEventRepository trackingEventRepository,
        IEventDispatcher eventDispatcher)
    {
        _trackingEventRepository = trackingEventRepository;
        _eventDispatcher = eventDispatcher;
    }

    public async Task<Result> Handle(IngestBrowserEventCommand request, CancellationToken cancellationToken)
    {
        var storeId = StoreId.From(request.StoreId);
        var orderId = request.OrderId.HasValue ? new OrderId(request.OrderId.Value) : (OrderId?)null;
        var correlationId = Guid.NewGuid();

        var payload = new TrackingEventPayload(
            storeId,
            request.EventKey,
            request.EventType,
            TrackingChannel.Server,
            DateTime.UtcNow,
            orderId,
            request.CustomerRef,
            request.Value,
            request.Currency,
            request.Contents?.Select(c => new TrackingContentItem(c.ContentId, c.Quantity, c.Price)).ToList(),
            request.PageUrl,
            request.ClientIpAddress,
            request.ClientUserAgent,
            request.CustomerEmail,
            request.CustomerPhone);

        // Idempotency: a retried POST for the same (store, eventKey) must not log the browser
        // marker twice or re-trigger a second server dispatch.
        var existingBrowserRow = await _trackingEventRepository.GetByEventKeyAndChannelAsync(
            storeId, request.EventKey, TrackingChannel.Browser, cancellationToken);

        if (existingBrowserRow == null)
        {
            var browserPayloadJson = System.Text.Json.JsonSerializer.Serialize(payload);
            var browserRowResult = TrackingEventAggregate.Create(
                storeId, request.EventKey, request.EventType, TrackingChannel.Browser,
                browserPayloadJson, correlationId, orderId, request.CustomerRef);

            if (browserRowResult.IsSuccess)
                await _trackingEventRepository.AddAsync(browserRowResult.Value, cancellationToken);
        }

        var existingServerRow = await _trackingEventRepository.GetByEventKeyAndChannelAsync(
            storeId, request.EventKey, TrackingChannel.Server, cancellationToken);

        if (existingServerRow == null)
            await _eventDispatcher.DispatchAsync(payload, cancellationToken);

        return Result.Success();
    }
}
