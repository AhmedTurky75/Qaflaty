namespace Qaflaty.Application.Analytics;

/// <summary>
/// Stable identity for a storefront visitor used by presence tracking. Authenticated
/// customers and guests get differently-prefixed keys so a login never collides with a
/// guest session, and the same key across multiple open tabs collapses to one visitor.
/// </summary>
public readonly record struct VisitorKey(string Value)
{
    public static VisitorKey ForCustomer(Guid customerId) => new($"customer:{customerId}");
    public static VisitorKey ForGuest(string guestId) => new($"guest:{guestId}");

    public override string ToString() => Value;
}
