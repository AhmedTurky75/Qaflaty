using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.Aggregates.StoreCustomer;
using Qaflaty.Domain.Identity.Repositories;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class StoreCustomerRepository : IStoreCustomerRepository
{
    private readonly QaflatyDbContext _context;

    public StoreCustomerRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<StoreCustomer?> GetByIdAsync(StoreCustomerId id, CancellationToken ct = default)
        => await _context.StoreCustomers
            .Include(c => c.RefreshTokens)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<StoreCustomer?> GetByEmailAsync(Email email, CancellationToken ct = default)
        => await _context.StoreCustomers
            .Include(c => c.RefreshTokens)
            .FirstOrDefaultAsync(c => c.Email.Value == email.Value, ct);

    public async Task<bool> ExistsByEmailAsync(Email email, CancellationToken ct = default)
        => await _context.StoreCustomers.AnyAsync(c => c.Email.Value == email.Value, ct);

    public async Task AddAsync(StoreCustomer customer, CancellationToken ct = default)
        => await _context.StoreCustomers.AddAsync(customer, ct);

    public void Update(StoreCustomer customer)
        => _context.StoreCustomers.Update(customer);

    public async Task<CustomerRefreshToken?> GetRefreshTokenAsync(string token, CancellationToken ct = default)
        => await _context.CustomerRefreshTokens.FirstOrDefaultAsync(rt => rt.Token == token, ct);
}
