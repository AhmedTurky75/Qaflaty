using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ordering.Commands.RejectBlockedOrder;

/// <summary>
/// Merchant rejected an order held against the phone blocklist. Cancels it without restoring stock,
/// because a blocked order never reserved any.
/// </summary>
public record RejectBlockedOrderCommand(
    Guid StoreId,
    Guid OrderId,
    string? Reason) : ICommand;
