using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Domain.Ordering.Aggregates.Order;

public sealed class OrderOtp
{
    public const int ExpiryMinutes = 10;
    public const int MaxAttempts = 5;

    public Guid Id { get; private set; }
    public OrderId OrderId { get; private set; }
    public string Code { get; private set; } = null!;
    public string Email { get; private set; } = null!;
    public DateTime CreatedAt { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public bool IsUsed { get; private set; }
    public int AttemptCount { get; private set; }

    private OrderOtp() { }

    public static OrderOtp Create(OrderId orderId, string email)
    {
        var code = Random.Shared.Next(100_000, 1_000_000).ToString("D6");
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
