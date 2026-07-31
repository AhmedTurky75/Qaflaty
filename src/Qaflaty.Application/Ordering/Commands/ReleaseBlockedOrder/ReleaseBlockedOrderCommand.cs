using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ordering.Commands.ReleaseBlockedOrder;

/// <summary>
/// Merchant approved an order that was held against the phone blocklist. Confirms it, and
/// optionally lifts the block on the number so future orders go through untouched.
/// </summary>
public record ReleaseBlockedOrderCommand(
    Guid StoreId,
    Guid OrderId,
    bool AlsoUnblockPhone) : ICommand;
