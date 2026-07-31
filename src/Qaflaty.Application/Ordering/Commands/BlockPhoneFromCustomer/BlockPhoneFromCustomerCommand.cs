using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;

namespace Qaflaty.Application.Ordering.Commands.BlockPhoneFromCustomer;

/// <summary>
/// Blocks a customer's phone number from the customer pages. Unlike the order-level action this is
/// not tied to a single order — every future order from the number is held for review. The phone is
/// resolved server-side from the customer so the client cannot block an arbitrary one.
/// </summary>
public record BlockPhoneFromCustomerCommand(
    Guid StoreId,
    Guid CustomerId,
    string? Reason) : ICommand<BlockedPhoneDto>;
