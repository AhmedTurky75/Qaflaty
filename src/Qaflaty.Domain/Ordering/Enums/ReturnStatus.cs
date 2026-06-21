namespace Qaflaty.Domain.Ordering.Enums;

public enum ReturnStatus
{
    /// <summary>Submitted by the customer, awaiting merchant review.</summary>
    Requested = 0,

    /// <summary>Merchant approved the return; refund pending.</summary>
    Approved = 1,

    /// <summary>Merchant declined the return.</summary>
    Rejected = 2,

    /// <summary>Refund has been issued.</summary>
    Refunded = 3,

    /// <summary>Withdrawn by the customer before resolution.</summary>
    Cancelled = 4
}
