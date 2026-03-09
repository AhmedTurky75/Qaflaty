namespace Qaflaty.Domain.Identity.Enums;

[Flags]
public enum MerchantPermission
{
    None = 0,
    ViewProducts = 1,
    ManageProducts = 2,
    ViewOrders = 4,
    ManageOrders = 8,
    ViewCustomers = 16,
    ManageCustomers = 32,
    ManageStore = 64,
    ManageChat = 128,
    ManageMerchants = 256
}
