using Microsoft.Extensions.Logging;
using Qaflaty.Application.Analytics.Abstractions;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Analytics.Commands.RecordHeartbeat;

public class RecordHeartbeatCommandHandler : ICommandHandler<RecordHeartbeatCommand>
{
    private readonly IPresenceTracker _presenceTracker;
    private readonly IDateTimeProvider _dateTimeProvider;
    private readonly ILogger<RecordHeartbeatCommandHandler> _logger;

    public RecordHeartbeatCommandHandler(
        IPresenceTracker presenceTracker,
        IDateTimeProvider dateTimeProvider,
        ILogger<RecordHeartbeatCommandHandler> logger)
    {
        _presenceTracker = presenceTracker;
        _dateTimeProvider = dateTimeProvider;
        _logger = logger;
    }

    public async Task<Result> Handle(RecordHeartbeatCommand request, CancellationToken cancellationToken)
    {
        var visitor = VisitorKeyResolver.Resolve(request.CustomerId, request.GuestId);
        if (visitor is null)
        {
            // TEMP [PRESENCE-DEBUG] — remove once diagnosed. Fires when neither a customer id nor
            // an X-Guest-Id reached the server, so nothing can be recorded.
            _logger.LogWarning("[PRESENCE-DEBUG] Heartbeat DROPPED: no visitor id (store={StoreId})", request.StoreId);
            return Result.Failure(new Error("Presence.MissingVisitorId",
                "Either an authenticated customer or a guest id is required"));
        }

        // TEMP [PRESENCE-DEBUG] — compare this store id against the one logged by
        // GetLiveMetricsQueryHandler; if they differ, the storefront and the merchant are pointed
        // at different stores (the usual cause of a stuck 0).
        _logger.LogInformation(
            "[PRESENCE-DEBUG] Heartbeat recorded: store={StoreId} visitor={Visitor} productSlug={ProductSlug}",
            request.StoreId, visitor.Value.Value, request.ProductSlug);

        await _presenceTracker.TouchAsync(
            new StoreId(request.StoreId), visitor.Value, request.ProductSlug, _dateTimeProvider.UtcNow, cancellationToken);

        return Result.Success();
    }
}
