using Qaflaty.Domain.Identity.Aggregates.LoginOtp;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Identity;

public class LoginOtpTests
{
    private static LoginOtp Create(string code = "123456") =>
        LoginOtp.Create("user@example.com", LoginOtpPurpose.MerchantLogin, code);

    [Fact]
    public void Create_SetsPurposeExpiryAndFreshState()
    {
        var otp = Create();

        Assert.Equal(LoginOtpPurpose.MerchantLogin, otp.Purpose);
        Assert.False(otp.IsUsed);
        Assert.Equal(0, otp.AttemptCount);
        Assert.False(otp.IsExpired());
        Assert.Equal(otp.CreatedAt.AddMinutes(LoginOtp.ExpiryMinutes), otp.ExpiresAt);
    }

    [Fact]
    public void Verify_Correct_MarksUsed()
    {
        var otp = Create("555000");

        Assert.True(otp.Verify("555000"));
        Assert.True(otp.IsUsed);
        Assert.Equal(1, otp.AttemptCount);
    }

    [Fact]
    public void Verify_Wrong_IncrementsWithoutMarkingUsed()
    {
        var otp = Create("555000");

        Assert.False(otp.Verify("000000"));
        Assert.False(otp.IsUsed);
        Assert.Equal(1, otp.AttemptCount);
    }

    [Fact]
    public void IsMaxAttemptsReached_TrueAtLimit()
    {
        var otp = Create("555000");

        for (var i = 0; i < LoginOtp.MaxAttempts; i++)
            otp.Verify("000000");

        Assert.True(otp.IsMaxAttemptsReached());
    }

    [Fact]
    public void CanResend_FalseImmediatelyAfterCreation()
    {
        var otp = Create();

        // Cooldown is 60s; a freshly created OTP cannot be resent yet.
        Assert.False(otp.CanResend());
    }

    [Fact]
    public void Invalidate_MarksUsed()
    {
        var otp = Create();

        otp.Invalidate();

        Assert.True(otp.IsUsed);
    }
}
