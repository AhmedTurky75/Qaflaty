using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Identity.Aggregates.StoreCustomer;

public sealed class CustomerRefreshToken : Entity<Guid>
{
    public StoreCustomerId StoreCustomerId { get; private set; } // Customer this refresh token was issued to
    public string Token { get; private set; } = null!; // The opaque refresh token string presented to renew access tokens
    public DateTime ExpiresAt { get; private set; } // UTC expiry after which the token can no longer be used
    public DateTime CreatedAt { get; private set; } // UTC timestamp when the token was issued
    public DateTime? RevokedAt { get; private set; } // UTC timestamp when revoked (e.g. logout); null if still valid

    public bool IsRevoked => RevokedAt.HasValue; // True once the token has been revoked
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt; // True once past the expiry time
    public bool IsActive => !IsRevoked && !IsExpired; // True when still usable (neither revoked nor expired)

    private CustomerRefreshToken() : base(Guid.Empty) { }

    public static CustomerRefreshToken Create(StoreCustomerId storeCustomerId, string token, DateTime expiresAt)
    {
        return new CustomerRefreshToken
        {
            Id = Guid.Empty,
            StoreCustomerId = storeCustomerId,
            Token = token,
            ExpiresAt = expiresAt,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Revoke() => RevokedAt = DateTime.UtcNow;
}
