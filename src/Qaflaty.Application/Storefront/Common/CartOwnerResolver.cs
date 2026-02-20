using Qaflaty.Application.Common;
using Qaflaty.Domain.Storefront.Aggregates.Cart;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Common;

/// <summary>
/// Shared helper for cart command/query handlers.
/// Resolves the correct cart from the repository based on the CartOwnerContext type,
/// eliminating duplicated switch logic across all handlers.
/// </summary>
internal static class CartOwnerResolver
{
    /// <summary>
    /// Returns the existing cart for the given owner, or null if none exists.
    /// </summary>
    internal static Task<Cart?> ResolveExistingCartAsync(
        CartOwnerContext owner,
        ICartRepository repo,
        CancellationToken ct) => owner switch
    {
        CartOwnerContext.CustomerOwner o => repo.GetByCustomerIdAsync(o.CustomerId, ct),
        CartOwnerContext.GuestOwner o    => repo.GetByGuestIdAsync(o.GuestId, o.StoreId, ct),
        _ => throw new ArgumentOutOfRangeException(nameof(owner))
    };

    /// <summary>
    /// Returns the existing cart, or creates and adds a new one if none exists.
    /// Callers must call ICartRepository.Update and IUnitOfWork.SaveChangesAsync after mutating.
    /// </summary>
    internal static async Task<Cart> ResolveOrCreateCartAsync(
        CartOwnerContext owner,
        ICartRepository repo,
        CancellationToken ct)
    {
        var existing = await ResolveExistingCartAsync(owner, repo, ct);
        if (existing != null) return existing;

        var createResult = owner switch
        {
            CartOwnerContext.CustomerOwner o => Cart.CreateForCustomer(o.CustomerId),
            CartOwnerContext.GuestOwner o    => Cart.CreateForGuest(o.GuestId, o.StoreId),
            _ => throw new ArgumentOutOfRangeException(nameof(owner))
        };

        if (createResult.IsFailure)
            throw new InvalidOperationException(createResult.Error.Message);

        await repo.AddAsync(createResult.Value, ct);
        return createResult.Value;
    }
}
