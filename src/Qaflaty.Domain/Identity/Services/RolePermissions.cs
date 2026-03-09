using Qaflaty.Domain.Identity.Enums;

namespace Qaflaty.Domain.Identity.Services;

public static class RolePermissions
{
    private static readonly Dictionary<MerchantRole, MerchantPermission> _permissions = new()
    {
        [MerchantRole.Owner] = MerchantPermission.ViewProducts | MerchantPermission.ManageProducts |
                               MerchantPermission.ViewOrders | MerchantPermission.ManageOrders |
                               MerchantPermission.ViewCustomers | MerchantPermission.ManageCustomers |
                               MerchantPermission.ManageStore | MerchantPermission.ManageChat |
                               MerchantPermission.ManageMerchants,
        [MerchantRole.Admin] = MerchantPermission.ViewProducts | MerchantPermission.ManageProducts |
                               MerchantPermission.ViewOrders | MerchantPermission.ManageOrders |
                               MerchantPermission.ViewCustomers | MerchantPermission.ManageCustomers |
                               MerchantPermission.ManageStore | MerchantPermission.ManageChat,
        [MerchantRole.Manager] = MerchantPermission.ViewProducts | MerchantPermission.ManageProducts |
                                 MerchantPermission.ViewOrders | MerchantPermission.ManageOrders |
                                 MerchantPermission.ViewCustomers | MerchantPermission.ManageChat,
        [MerchantRole.Staff] = MerchantPermission.ViewProducts | MerchantPermission.ViewOrders |
                               MerchantPermission.ViewCustomers
    };

    public static MerchantPermission GetPermissions(MerchantRole role)
        => _permissions.TryGetValue(role, out var perms) ? perms : MerchantPermission.None;

    public static bool HasPermission(MerchantRole role, MerchantPermission permission)
        => (GetPermissions(role) & permission) == permission;
}
