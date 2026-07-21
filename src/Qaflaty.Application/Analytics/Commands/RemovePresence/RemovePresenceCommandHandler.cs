using Qaflaty.Application.Analytics.Abstractions;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Analytics.Commands.RemovePresence;

public class RemovePresenceCommandHandler : ICommandHandler<RemovePresenceCommand>
{
    private readonly IPresenceTracker _presenceTracker;

    public RemovePresenceCommandHandler(IPresenceTracker presenceTracker)
    {
        _presenceTracker = presenceTracker;
    }

    public async Task<Result> Handle(RemovePresenceCommand request, CancellationToken cancellationToken)
    {
        var visitor = VisitorKeyResolver.Resolve(request.CustomerId, request.GuestId);
        if (visitor is null)
            return Result.Success(); // Nothing to remove — not an error (best-effort beacon).

        await _presenceTracker.RemoveAsync(new StoreId(request.StoreId), visitor.Value, cancellationToken);
        return Result.Success();
    }
}
