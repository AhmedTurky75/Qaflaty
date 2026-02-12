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

    public async Task AddAsync(Cart cart, CancellationToken ct = default)
        => await _context.Carts.AddAsync(cart, ct);

    public void Update(Cart cart)
        => _context.Carts.Update(cart);

    public void Delete(Cart cart)
        => _context.Carts.Remove(cart);
}
