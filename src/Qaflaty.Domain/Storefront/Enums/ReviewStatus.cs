namespace Qaflaty.Domain.Storefront.Enums;

public enum ReviewStatus
{
    /// <summary>Awaiting merchant moderation. Not publicly visible.</summary>
    Pending = 1,

    /// <summary>Approved and publicly visible.</summary>
    Approved = 2,

    /// <summary>Rejected by the merchant. Not publicly visible.</summary>
    Rejected = 3,

    /// <summary>Was approved but hidden by the merchant. Not publicly visible.</summary>
    Hidden = 4
}
