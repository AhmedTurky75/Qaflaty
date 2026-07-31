using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Identity.Enums;

namespace Qaflaty.Domain.Identity.Aggregates.Merchant;

public sealed class MerchantStoreAssignment
{
    public Guid Id { get; private set; } // Primary key of the assignment record
    public MerchantId MerchantId { get; private set; } // Merchant (staff/owner) being granted access
    public StoreId StoreId { get; private set; } // Store the merchant is assigned to
    public MerchantRole Role { get; private set; } // Role granting permission scope in this store, e.g. Owner, Manager, Staff
    public bool IsActive { get; private set; } // Whether the assignment is currently active (deactivated on removal)
    public MerchantId? InvitedBy { get; private set; } // The merchant who invited this one, if applicable
    public DateTime CreatedAt { get; private set; } // UTC timestamp when the assignment was created

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
