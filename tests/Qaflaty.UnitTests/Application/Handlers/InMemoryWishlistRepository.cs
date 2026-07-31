using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Wishlist;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.UnitTests.Application.Handlers;

internal sealed class InMemoryWishlistRepository : IWishlistRepository
{
    private readonly Dictionary<StoreCustomerId, Wishlist> _store = new();

    public int AddCallCount { get; private set; }
    public int UpdateCallCount { get; private set; }

    public InMemoryWishlistRepository(Wishlist? seed = null)
    {
        if (seed != null)
            _store[seed.CustomerId] = seed;
    }

    public Task<Wishlist?> GetByCustomerIdAsync(StoreCustomerId customerId, CancellationToken ct = default)
        => Task.FromResult(_store.GetValueOrDefault(customerId));

    public Task AddAsync(Wishlist wishlist, CancellationToken ct = default)
    {
        AddCallCount++;
        _store[wishlist.CustomerId] = wishlist;
        return Task.CompletedTask;
    }

    public void Update(Wishlist wishlist)
    {
        UpdateCallCount++;
        _store[wishlist.CustomerId] = wishlist;
    }

    public Task<IReadOnlyList<(Guid ProductId, int Count)>> GetWishlistCountsByProductAsync(CancellationToken ct = default)
        => throw new NotSupportedException();
    public void Delete(Wishlist wishlist) => throw new NotSupportedException();
}
