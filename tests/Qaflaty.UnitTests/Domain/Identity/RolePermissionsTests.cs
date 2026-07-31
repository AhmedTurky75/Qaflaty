using Qaflaty.Domain.Identity.Enums;
using Qaflaty.Domain.Identity.Services;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Identity;

public class RolePermissionsTests
{
    [Fact]
    public void Owner_HasManageMerchants()
    {
        Assert.True(RolePermissions.HasPermission(MerchantRole.Owner, MerchantPermission.ManageMerchants));
    }

    [Fact]
    public void Admin_HasManageStore_ButNotManageMerchants()
    {
        Assert.True(RolePermissions.HasPermission(MerchantRole.Admin, MerchantPermission.ManageStore));
        Assert.False(RolePermissions.HasPermission(MerchantRole.Admin, MerchantPermission.ManageMerchants));
    }

    [Fact]
    public void Manager_CanManageProducts_ButNotManageStore()
    {
        Assert.True(RolePermissions.HasPermission(MerchantRole.Manager, MerchantPermission.ManageProducts));
        Assert.False(RolePermissions.HasPermission(MerchantRole.Manager, MerchantPermission.ManageStore));
        Assert.False(RolePermissions.HasPermission(MerchantRole.Manager, MerchantPermission.ManageCustomers));
    }

    [Fact]
    public void Staff_IsViewOnly()
    {
        Assert.True(RolePermissions.HasPermission(MerchantRole.Staff, MerchantPermission.ViewProducts));
        Assert.True(RolePermissions.HasPermission(MerchantRole.Staff, MerchantPermission.ViewOrders));
        Assert.True(RolePermissions.HasPermission(MerchantRole.Staff, MerchantPermission.ViewCustomers));

        Assert.False(RolePermissions.HasPermission(MerchantRole.Staff, MerchantPermission.ManageProducts));
        Assert.False(RolePermissions.HasPermission(MerchantRole.Staff, MerchantPermission.ManageOrders));
        Assert.False(RolePermissions.HasPermission(MerchantRole.Staff, MerchantPermission.ManageChat));
    }

    [Fact]
    public void HasPermission_WithCombinedFlags_RequiresAll()
    {
        // Manager has ViewProducts and ManageProducts but not ManageStore, so a combined
        // request that includes ManageStore must be denied.
        var combined = MerchantPermission.ViewProducts | MerchantPermission.ManageStore;

        Assert.False(RolePermissions.HasPermission(MerchantRole.Manager, combined));
    }

    [Fact]
    public void GetPermissions_Staff_DoesNotIncludeManageFlags()
    {
        var perms = RolePermissions.GetPermissions(MerchantRole.Staff);

        Assert.Equal(MerchantPermission.None, perms & MerchantPermission.ManageProducts);
    }
}
