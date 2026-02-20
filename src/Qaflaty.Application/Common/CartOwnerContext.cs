using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Common;

/// <summary>
/// Discriminated union representing who owns a cart.
/// Authenticated endpoints pass CustomerOwner; guest endpoints pass GuestOwner.
/// All cart commands/queries accept this type so the same handlers serve both cases.
/// </summary>
public abstract record CartOwnerContext
{
    public sealed record CustomerOwner(StoreCustomerId CustomerId) : CartOwnerContext;
    public sealed record GuestOwner(string GuestId, StoreId StoreId) : CartOwnerContext;
}
