using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Common;

/// <summary>
/// Removes the cart that was just checked out so it stops appearing in the merchant's
/// live active-carts list. Called from wherever an order actually becomes Confirmed
/// (immediate non-OTP checkout, or OTP verification) — both know the storefront buyer
/// identity (authenticated customer id or guest id) that <see cref="Domain.Ordering.Aggregates.Order.Events.OrderPlacedEvent"/>
/// itself does not carry (it only has the phone-derived Ordering.Customer id, which is
/// unrelated to the Cart aggregate's owner).
/// </summary>
public interface ICartConversionService
{
    Task ConvertCartAsync(StoreId storeId, Guid? buyerCustomerId, string? buyerGuestId, CancellationToken ct);
}
