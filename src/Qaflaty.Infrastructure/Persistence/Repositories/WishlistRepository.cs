using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Wishlist;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class WishlistRepository : IWishlistRepository
{
    private readonly QaflatyDbContext _context;

    public WishlistRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<Wishlist?> GetByCustomerIdAsync(StoreCustomerId customerId, CancellationToken ct = default)
        => await _context.Wishlists
            .Include(w => w.Items)
            .FirstOrDefaultAsync(w => w.CustomerId == customerId, ct);

    public async Task AddAsync(Wishlist wishlist, CancellationToken ct = default)
        => await _context.Wishlists.AddAsync(wishlist, ct);

    public void Update(Wishlist wishlist)
        => _context.Wishlists.Update(wishlist);

    public void Delete(Wishlist wishlist)
        => _context.Wishlists.Remove(wishlist);
}
