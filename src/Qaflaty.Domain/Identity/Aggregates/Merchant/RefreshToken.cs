using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Identity.Aggregates.Merchant;

public sealed class RefreshToken : Entity<Guid>
{
    public MerchantId MerchantId { get; private set; }
    public string Token { get; private set; } = null!;
    public DateTime ExpiresAt { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? RevokedAt { get; private set; }

    public bool IsRevoked => RevokedAt.HasValue;
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsActive => !IsRevoked && !IsExpired;

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
