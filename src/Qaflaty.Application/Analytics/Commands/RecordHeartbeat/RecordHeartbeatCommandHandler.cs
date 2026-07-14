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

    public RecordHeartbeatCommandHandler(IPresenceTracker presenceTracker, IDateTimeProvider dateTimeProvider)
    {
        _presenceTracker = presenceTracker;
        _dateTimeProvider = dateTimeProvider;
    }

    public async Task<Result> Handle(RecordHeartbeatCommand request, CancellationToken cancellationToken)
    {
        var visitor = VisitorKeyResolver.Resolve(request.CustomerId, request.GuestId);
        if (visitor is null)
            return Result.Failure(new Error("Presence.MissingVisitorId",
                "Either an authenticated customer or a guest id is required"));

        await _presenceTracker.TouchAsync(
            new StoreId(request.StoreId), visitor.Value, request.ProductId, _dateTimeProvider.UtcNow, cancellationToken);

        return Result.Success();
    }
}
