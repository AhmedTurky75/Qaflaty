using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.Aggregates.Merchant;
using Qaflaty.Domain.Identity.Aggregates.Merchant.Events;
using Qaflaty.Domain.Identity.Enums;
using Qaflaty.Domain.Identity.ValueObjects;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Identity;

public class MerchantTests
{
    private static Merchant NewMerchant() =>
        Merchant.Create(
            Email.Create("owner@shop.com").Value,
            HashedPassword.FromHash("hash-1"),
            PersonName.Create("Ahmed", "Ali").Value,
            "ahmed").Value;

    [Fact]
    public void Create_IsUnverified_AndRaisesRegisteredEvent()
    {
        var merchant = NewMerchant();

        Assert.False(merchant.IsVerified);
        Assert.Contains(merchant.DomainEvents, e => e is MerchantRegisteredEvent);
    }

    [Fact]
    public void Verify_FirstTime_Succeeds()
    {
        var merchant = NewMerchant();

        var result = merchant.Verify();

        Assert.True(result.IsSuccess);
        Assert.True(merchant.IsVerified);
    }

    [Fact]
    public void Verify_WhenAlreadyVerified_Fails()
    {
        var merchant = NewMerchant();
        merchant.Verify();

        var result = merchant.Verify();

        Assert.True(result.IsFailure);
        Assert.Equal("Identity.AlreadyVerified", result.Error.Code);
    }

    [Fact]
    public void ChangePassword_UpdatesHash_AndRaisesEvent()
    {
        var merchant = NewMerchant();
        merchant.ClearDomainEvents();

        merchant.ChangePassword(HashedPassword.FromHash("hash-2"));

        Assert.Equal("hash-2", merchant.PasswordHash.Value);
        Assert.Contains(merchant.DomainEvents, e => e is PasswordChangedEvent);
    }

    // ---------- Store assignments ----------

    [Fact]
    public void AssignToStore_GrantsAccessAndRole()
    {
        var merchant = NewMerchant();
        var storeId = StoreId.New();

        merchant.AssignToStore(storeId, MerchantRole.Manager);

        Assert.True(merchant.HasAccessToStore(storeId));
        Assert.Equal(MerchantRole.Manager, merchant.GetRoleForStore(storeId));
    }

    [Fact]
    public void AssignToStore_SameStoreTwice_DoesNotDuplicate()
    {
        var merchant = NewMerchant();
        var storeId = StoreId.New();

        var first = merchant.AssignToStore(storeId, MerchantRole.Admin);
        var second = merchant.AssignToStore(storeId, MerchantRole.Staff);

        Assert.Same(first, second); // returns existing active assignment
        Assert.Single(merchant.StoreAssignments);
    }

    [Fact]
    public void RemoveFromStore_RevokesAccess()
    {
        var merchant = NewMerchant();
        var storeId = StoreId.New();
        merchant.AssignToStore(storeId, MerchantRole.Admin);

        merchant.RemoveFromStore(storeId);

        Assert.False(merchant.HasAccessToStore(storeId));
        Assert.Null(merchant.GetRoleForStore(storeId));
    }

    [Fact]
    public void HasAccessToStore_UnknownStore_IsFalse()
    {
        var merchant = NewMerchant();

        Assert.False(merchant.HasAccessToStore(StoreId.New()));
    }

    // ---------- Refresh tokens ----------

    [Fact]
    public void RevokeRefreshToken_RevokesMatchingToken()
    {
        var merchant = NewMerchant();
        merchant.AddRefreshToken("tok-1", DateTime.UtcNow.AddDays(7));

        merchant.RevokeRefreshToken("tok-1");

        Assert.True(merchant.RefreshTokens.Single().IsRevoked);
    }

    [Fact]
    public void RevokeAllRefreshTokens_RevokesEveryActiveToken()
    {
        var merchant = NewMerchant();
        merchant.AddRefreshToken("tok-1", DateTime.UtcNow.AddDays(7));
        merchant.AddRefreshToken("tok-2", DateTime.UtcNow.AddDays(7));

        merchant.RevokeAllRefreshTokens();

        Assert.All(merchant.RefreshTokens, t => Assert.True(t.IsRevoked));
    }
}
