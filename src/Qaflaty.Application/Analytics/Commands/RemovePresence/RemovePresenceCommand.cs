using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Analytics.Commands.RemovePresence;

/// <summary>Explicit "leave" signal — sent on tab/browser close so the visitor stops counting immediately instead of waiting out the TTL.</summary>
public record RemovePresenceCommand(
    Guid StoreId,
    Guid? CustomerId,
    string? GuestId
) : ICommand;
