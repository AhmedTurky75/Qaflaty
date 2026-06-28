using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;

namespace Qaflaty.Application.Ordering.Queries.TrackOrder;

/// <summary>
/// Public order-tracking lookup. <paramref name="Contact"/> is the email or phone captured on the
/// order and is required to authorize a guest — order numbers alone are low-entropy and guessable.
/// </summary>
public record TrackOrderQuery(Guid StoreId, string OrderNumber, string? Contact) : IQuery<OrderTrackingDto>;
