using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;

namespace Qaflaty.Application.Ordering.Commands.BlockPhoneFromOrder;

/// <summary>
/// Blocks the phone number behind an order — the action offered from the orders table. The number
/// is resolved server-side from the order so the client cannot ask to block an arbitrary one.
/// </summary>
public record BlockPhoneFromOrderCommand(
    Guid StoreId,
    Guid OrderId,
    string? Reason) : ICommand<BlockedPhoneDto>;
