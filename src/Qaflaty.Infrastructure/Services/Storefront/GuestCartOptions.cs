namespace Qaflaty.Infrastructure.Services.Storefront;

/// <summary>
/// Binds the "GuestCart" configuration section — lifetime policy for anonymous (guest) carts.
/// Guest carts are identified only by a browser session id and are almost never resumed after a
/// few days, so they're kept for a short window then purged. The cart lives only on the backend
/// (the storefront never persists cart contents in the browser), so once it's gone a returning
/// guest simply starts a fresh cart — no stale client-side copy to conflict with.
/// </summary>
public sealed class GuestCartOptions
{
    public const string SectionName = "GuestCart";

    /// <summary>How many days a guest cart may sit idle before it stops counting as "open" and is purged. Default 3.</summary>
    public int TtlDays { get; set; } = 3;

    public TimeSpan Ttl => TimeSpan.FromDays(TtlDays > 0 ? TtlDays : 3);
}
