using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Identity.Aggregates.StoreCustomer;

public sealed class CustomerRefreshToken : Entity<Guid>
{
    public StoreCustomerId StoreCustomerId { get; private set; }
    public string Token { get; private set; } = null!;
    public DateTime ExpiresAt { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? RevokedAt { get; private set; }

    public bool IsRevoked => RevokedAt.HasValue;
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsActive => !IsRevoked && !IsExpired;

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
