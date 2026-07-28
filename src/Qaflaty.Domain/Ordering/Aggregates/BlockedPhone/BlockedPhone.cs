using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.Domain.Ordering.Aggregates.BlockedPhone;

/// <summary>
/// A phone number the merchant has blocked from ordering. Orders placed from a blocked number are
/// still created, but land in <see cref="Enums.OrderStatus.Blocked"/> for the merchant to review
/// rather than being confirmed. Blocking is per-store: each tenant keeps its own list.
/// </summary>
public sealed class BlockedPhone : AggregateRoot<BlockedPhoneId>
{
    public StoreId StoreId { get; private set; } // Store (tenant) this block belongs to
    public PhoneNumber Phone { get; private set; } = null!; // The blocked number, stored E.164 so matching is an exact string compare
    public string? Reason { get; private set; } // Optional merchant note explaining why the number was blocked
    public string BlockedBy { get; private set; } = string.Empty; // Display name of the merchant user who added the block
    public OrderId? SourceOrderId { get; private set; } // Order the block was created from, when blocked via the orders list
    public DateTime BlockedAt { get; private set; } // UTC timestamp the block was created
    public DateTime UpdatedAt { get; private set; } // UTC timestamp of the last edit to the block

    private BlockedPhone() : base(BlockedPhoneId.Empty) { }

    public static Result<BlockedPhone> Create(
        StoreId storeId,
        PhoneNumber phone,
        string blockedBy,
        string? reason = null,
        OrderId? sourceOrderId = null)
    {
        if (string.IsNullOrWhiteSpace(blockedBy))
            return Result.Failure<BlockedPhone>(new Error("BlockedPhone.BlockedByRequired",
                "The merchant performing the block must be identified"));

        var now = DateTime.UtcNow;

        return Result.Success(new BlockedPhone
        {
            Id = BlockedPhoneId.New(),
            StoreId = storeId,
            Phone = phone,
            Reason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim(),
            BlockedBy = blockedBy,
            SourceOrderId = sourceOrderId,
            BlockedAt = now,
            UpdatedAt = now
        });
    }

    public void UpdateReason(string? reason)
    {
        Reason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
        UpdatedAt = DateTime.UtcNow;
    }
}
