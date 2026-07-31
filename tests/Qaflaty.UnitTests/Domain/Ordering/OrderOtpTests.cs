using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Aggregates.Order;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Ordering;

public class OrderOtpTests
{
    private static OrderOtp Create(string code = "123456") =>
        OrderOtp.Create(OrderId.New(), "customer@example.com", code);

    [Fact]
    public void Create_SetsExpiryTenMinutesOut_AndNotUsed()
    {
        var otp = Create();

        Assert.False(otp.IsUsed);
        Assert.Equal(0, otp.AttemptCount);
        Assert.False(otp.IsExpired());
        Assert.Equal(otp.CreatedAt.AddMinutes(OrderOtp.ExpiryMinutes), otp.ExpiresAt);
    }

    [Fact]
    public void Create_WithoutOverride_GeneratesSixDigitCode()
    {
        var otp = OrderOtp.Create(OrderId.New(), "c@example.com");

        Assert.Matches(@"^\d{6}$", otp.Code);
    }

    [Fact]
    public void Verify_CorrectCode_SucceedsAndMarksUsed()
    {
        var otp = Create("654321");

        var ok = otp.Verify("654321");

        Assert.True(ok);
        Assert.True(otp.IsUsed);
        Assert.Equal(1, otp.AttemptCount);
    }

    [Fact]
    public void Verify_WrongCode_FailsAndIncrementsAttempts()
    {
        var otp = Create("654321");

        var ok = otp.Verify("000000");

        Assert.False(ok);
        Assert.False(otp.IsUsed);
        Assert.Equal(1, otp.AttemptCount);
    }

    [Fact]
    public void Verify_EachAttempt_IncrementsCount()
    {
        var otp = Create("654321");

        otp.Verify("111111");
        otp.Verify("222222");
        otp.Verify("333333");

        Assert.Equal(3, otp.AttemptCount);
    }

    [Fact]
    public void IsMaxAttemptsReached_TrueAfterFiveAttempts()
    {
        var otp = Create("654321");

        for (var i = 0; i < OrderOtp.MaxAttempts; i++)
            otp.Verify("000000");

        Assert.True(otp.IsMaxAttemptsReached());
    }

    [Fact]
    public void Invalidate_MarksUsed()
    {
        var otp = Create();

        otp.Invalidate();

        Assert.True(otp.IsUsed);
    }
}
