using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Cart;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class CartRepository : ICartRepository
{
    private readonly QaflatyDbContext _context;

    public CartRepository(QaflatyDbContext context)
    {
        _context = context;
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
        => await _context.Carts
            .Include(c => c.Items)
            .Where(c => c.Items.Any() &&
                (c.StoreId == storeId ||
                 c.Items.Any(i => _context.Products
                     .Any(p => p.Id == i.ProductId && p.StoreId == storeId))))
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync(ct);

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
