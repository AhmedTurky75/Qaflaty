using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Identity.Aggregates.Merchant;

public sealed class RefreshToken : Entity<Guid>
{
    public MerchantId MerchantId { get; private set; } // Merchant this refresh token was issued to
    public string Token { get; private set; } = null!; // The opaque refresh token string presented to renew access tokens
    public DateTime ExpiresAt { get; private set; } // UTC expiry after which the token can no longer be used
    public DateTime CreatedAt { get; private set; } // UTC timestamp when the token was issued
    public DateTime? RevokedAt { get; private set; } // UTC timestamp when the token was revoked (e.g. logout); null if still valid

    public bool IsRevoked => RevokedAt.HasValue; // True once the token has been revoked
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt; // True once past the expiry time
    public bool IsActive => !IsRevoked && !IsExpired; // True when the token is still usable (neither revoked nor expired)

    private RefreshToken() : base(Guid.Empty) { }

    public static RefreshToken Create(MerchantId merchantId, string token, DateTime expiresAt)
    {
        return new RefreshToken
        {
            Id = Guid.Empty,
            MerchantId = merchantId,
            Token = token,
            ExpiresAt = expiresAt,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Revoke() => RevokedAt = DateTime.UtcNow;
}
