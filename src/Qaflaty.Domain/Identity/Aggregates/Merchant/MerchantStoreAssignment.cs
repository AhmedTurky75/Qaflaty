using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Identity.Enums;

namespace Qaflaty.Domain.Identity.Aggregates.Merchant;

public sealed class MerchantStoreAssignment
{
    public Guid Id { get; private set; }
    public MerchantId MerchantId { get; private set; }
    public StoreId StoreId { get; private set; }
    public MerchantRole Role { get; private set; }
    public bool IsActive { get; private set; }
    public MerchantId? InvitedBy { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private MerchantStoreAssignment() { }

    public static MerchantStoreAssignment Create(
        MerchantId merchantId,
        StoreId storeId,
        MerchantRole role,
        MerchantId? invitedBy = null)
        => new MerchantStoreAssignment
        {
            Id = Guid.NewGuid(),
            MerchantId = merchantId,
            StoreId = storeId,
            Role = role,
            IsActive = true,
            InvitedBy = invitedBy,
            CreatedAt = DateTime.UtcNow
        };

    public void Deactivate() => IsActive = false;
    public void ChangeRole(MerchantRole role) => Role = role;
}
