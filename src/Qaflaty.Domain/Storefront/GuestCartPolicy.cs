namespace Qaflaty.Domain.Storefront;

/// <summary>
/// Lifetime policy for anonymous (guest) carts. Guest carts are identified only by a browser
/// session id and are almost never resumed after a few days, so they're kept for a short window
/// then purged. The cart lives only on the backend (the storefront never persists cart contents in
/// the browser), so once it's gone a returning guest simply starts a fresh cart — no stale
/// client-side copy to conflict with.
/// </summary>
public static class GuestCartPolicy
{
    /// <summary>How long a guest cart may sit idle before it stops counting as "open" and is purged.</summary>
    public static readonly TimeSpan Ttl = TimeSpan.FromDays(3);
}
