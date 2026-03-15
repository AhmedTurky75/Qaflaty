namespace Qaflaty.Domain.Identity.Aggregates.LoginOtp;

public enum LoginOtpPurpose
{
    MerchantLogin = 1,
    CustomerLogin = 2
}

public sealed class LoginOtp
{
    public const int ExpiryMinutes = 10;
    public const int MaxAttempts = 5;
    public const int ResendCooldownSeconds = 60;

    public Guid Id { get; private set; }
    public string Email { get; private set; } = null!;
    public string Code { get; private set; } = null!;
    public LoginOtpPurpose Purpose { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public bool IsUsed { get; private set; }
    public int AttemptCount { get; private set; }

    private LoginOtp() { }

    public static LoginOtp Create(string email, LoginOtpPurpose purpose, string? codeOverride = null)
    {
        var code = codeOverride ?? Random.Shared.Next(100_000, 1_000_000).ToString("D6");
        var now = DateTime.UtcNow;

        return new LoginOtp
        {
            Id = Guid.NewGuid(),
            Email = email,
            Code = code,
            Purpose = purpose,
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

    public void Invalidate() => IsUsed = true;

    public bool CanResend() => DateTime.UtcNow >= CreatedAt.AddSeconds(ResendCooldownSeconds);
}
