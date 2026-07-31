using Qaflaty.Domain.Ordering.Aggregates.Order;
using Qaflaty.Domain.Ordering.Enums;

namespace Qaflaty.Application.Ordering.Common;

/// <summary>
/// Projects order state for storefront (customer-facing) responses.
///
/// <see cref="OrderStatus.Blocked"/> is an internal moderation state: the customer completed
/// checkout normally and must see the ordinary "awaiting confirmation" experience, both so the
/// merchant keeps the decision and so a blocked number is not told it has been blocked. Merchant
/// endpoints deliberately do NOT use this and show the real status.
/// </summary>
public static class CustomerFacingOrderStatus
{
    /// <summary>
    /// Blocked maps to Confirmed, not Pending. An order only reaches Blocked at the exact point a
    /// normal order would have been confirmed — after OTP verification, or immediately at placement
    /// when the store does not require OTP. Reporting Pending there would send the storefront to the
    /// OTP screen (it routes on <c>status === Pending</c>) for an order whose code was never emailed.
    /// </summary>
    public static string Map(OrderStatus status) =>
        status == OrderStatus.Blocked
            ? nameof(OrderStatus.Confirmed)
            : status.ToString();

    /// <summary>
    /// Hides the Pending → Blocked transition from the customer's order timeline; masking it to
    /// "Pending → Pending" would be more conspicuous than omitting it.
    /// </summary>
    public static bool IsVisibleToCustomer(OrderStatusChange change) =>
        change.FromStatus != OrderStatus.Blocked && change.ToStatus != OrderStatus.Blocked;
}
