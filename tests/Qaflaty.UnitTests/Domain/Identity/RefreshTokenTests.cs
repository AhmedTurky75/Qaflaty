using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Identity.Aggregates.Merchant;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Identity;

public class RefreshTokenTests
{
    [Fact]
    public void Create_IsActive_WhenNotExpiredOrRevoked()
    {
        var token = RefreshToken.Create(MerchantId.New(), "tok", DateTime.UtcNow.AddDays(1));

        Assert.True(token.IsActive);
        Assert.False(token.IsRevoked);
        Assert.False(token.IsExpired);
    }

    [Fact]
    public void Expired_WhenPastExpiry()
    {
        var token = RefreshToken.Create(MerchantId.New(), "tok", DateTime.UtcNow.AddSeconds(-1));

        Assert.True(token.IsExpired);
        Assert.False(token.IsActive);
    }

    [Fact]
    public void Revoke_MakesInactive()
    {
        var token = RefreshToken.Create(MerchantId.New(), "tok", DateTime.UtcNow.AddDays(1));

        token.Revoke();

        Assert.True(token.IsRevoked);
        Assert.False(token.IsActive);
    }
}
