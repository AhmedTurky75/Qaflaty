using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Analytics.Commands.RecordHeartbeat;

/// <summary>
/// Either <paramref name="CustomerId"/> (authenticated storefront customer) or
/// <paramref name="GuestId"/> (anonymous session) must be supplied — the controller resolves
/// both from the request (JWT claim / X-Guest-Id header) before dispatching.
/// </summary>
public record RecordHeartbeatCommand(
    Guid StoreId,
    Guid? CustomerId,
    string? GuestId,
    Guid? ProductId
) : ICommand;
