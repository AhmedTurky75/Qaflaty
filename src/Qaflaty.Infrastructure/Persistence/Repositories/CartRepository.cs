using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Cart;
using Qaflaty.Domain.Storefront.Repositories;
using Qaflaty.Infrastructure.Services.Storefront;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class CartRepository : ICartRepository
{
    private readonly QaflatyDbContext _context;
    private readonly GuestCartOptions _guestCartOptions;

    public CartRepository(QaflatyDbContext context, IOptions<GuestCartOptions> guestCartOptions)
    {
        _context = context;
        _guestCartOptions = guestCartOptions.Value;
    }

    public async Task<Cart?> GetByCustomerIdAsync(StoreCustomerId customerId, CancellationToken ct = default)
        => await _context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.CustomerId == customerId, ct);

    public async Task<Cart?> GetByGuestIdAsync(string guestId, StoreId storeId, CancellationToken ct = default)
        => await _context.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.GuestId == guestId && c.StoreId == storeId, ct);

    public async Task<List<Cart>> GetActiveCartsByStoreAsync(StoreId storeId, CancellationToken ct = default)
    {
        // Guest carts older than the TTL are treated as closed (they'll be purged by the cleanup
        // service); authenticated carts (GuestId == null) are always shown.
        var guestCutoff = DateTime.UtcNow.Subtract(_guestCartOptions.Ttl);

        return await _context.Carts
            .Include(c => c.Items)
            .Where(c => c.Items.Any() &&
                (c.GuestId == null || c.UpdatedAt >= guestCutoff) &&
                (c.StoreId == storeId ||
                 c.Items.Any(i => _context.Products
                     .Any(p => p.Id == i.ProductId && p.StoreId == storeId))))
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync(ct);
    }

    public async Task<int> CountActiveCartsByStoreAsync(StoreId storeId, CancellationToken ct = default)
    {
        var guestCutoff = DateTime.UtcNow.Subtract(_guestCartOptions.Ttl);

        return await _context.Carts
            .Where(c => c.Items.Any() &&
                (c.GuestId == null || c.UpdatedAt >= guestCutoff) &&
                (c.StoreId == storeId ||
                 c.Items.Any(i => _context.Products
                     .Any(p => p.Id == i.ProductId && p.StoreId == storeId))))
            .CountAsync(ct);
    }

    public async Task<int> DeleteExpiredGuestCartsAsync(DateTime cutoff, CancellationToken ct = default)
    {
        var expired = await _context.Carts
            .Where(c => c.GuestId != null && c.UpdatedAt < cutoff)
            .ToListAsync(ct);

        _context.Carts.RemoveRange(expired);
        return expired.Count;
    }

    public async Task AddAsync(Cart cart, CancellationToken ct = default)
        => await _context.Carts.AddAsync(cart, ct);

    public void Update(Cart cart)
        => _context.Carts.Update(cart);

    public void Delete(Cart cart)
        => _context.Carts.Remove(cart);
}
