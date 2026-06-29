using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Domain.Ordering.Aggregates.Order;

public sealed class OrderOtp
{
    public const int ExpiryMinutes = 10;
    public const int MaxAttempts = 5;

    public Guid Id { get; private set; } // Primary key of the OTP record
    public OrderId OrderId { get; private set; } // Order this OTP confirms
    public string Code { get; private set; } = null!; // The 6-digit one-time code emailed to the customer, e.g. "048213"
    public string Email { get; private set; } = null!; // Email address the code was sent to
    public DateTime CreatedAt { get; private set; } // UTC timestamp when the code was generated
    public DateTime ExpiresAt { get; private set; } // UTC expiry (CreatedAt + 10 minutes); after this the code is invalid
    public bool IsUsed { get; private set; } // True once the code has been successfully verified or invalidated
    public int AttemptCount { get; private set; } // Number of verification attempts made (max 5 before lockout)

    private OrderOtp() { }

    public static OrderOtp Create(OrderId orderId, string email, string? codeOverride = null)
    {
        var code = codeOverride ?? Random.Shared.Next(100_000, 1_000_000).ToString("D6");
        var now = DateTime.UtcNow;

        return new OrderOtp
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            Code = code,
            Email = email,
            CreatedAt = now,
            ExpiresAt = now.AddMinutes(ExpiryMinutes),
            IsUsed = false,
            AttemptCount = 0
        };
    }

    public bool IsExpired() => DateTime.UtcNow > ExpiresAt;

    public bool IsMaxAttemptsReached() => AttemptCount >= MaxAttempts;

    public bool Verify(string code)
    {
        AttemptCount++;

        if (Code == code)
        {
            IsUsed = true;
            return true;
        }

        return false;
    }

    public void Invalidate()
    {
        IsUsed = true;
    }
}
