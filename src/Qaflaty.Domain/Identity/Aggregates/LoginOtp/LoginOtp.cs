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

    public Guid Id { get; private set; } // Primary key of the OTP record
    public string Email { get; private set; } = null!; // Email the login code was sent to
    public string Code { get; private set; } = null!; // The 6-digit one-time login code, e.g. "048213"
    public LoginOtpPurpose Purpose { get; private set; } // Whether the code is for MerchantLogin or CustomerLogin
    public DateTime CreatedAt { get; private set; } // UTC timestamp when the code was generated
    public DateTime ExpiresAt { get; private set; } // UTC expiry (CreatedAt + 10 minutes)
    public bool IsUsed { get; private set; } // True once the code has been verified or invalidated
    public int AttemptCount { get; private set; } // Number of verification attempts (max 5 before lockout)

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
