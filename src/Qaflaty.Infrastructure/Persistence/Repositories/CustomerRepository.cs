using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Ordering.Aggregates.Customer;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class CustomerRepository : ICustomerRepository
{
    private readonly QaflatyDbContext _context;

    public CustomerRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<Customer?> GetByIdAsync(CustomerId id, CancellationToken ct = default)
        => await _context.Customers.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<Customer?> GetByPhoneAsync(StoreId storeId, PhoneNumber phone, CancellationToken ct = default)
        => await _context.Customers
            .FirstOrDefaultAsync(c => c.StoreId == storeId && c.Contact.Phone.Value == phone.Value, ct);

    public async Task<IReadOnlyList<Customer>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default)
        => await _context.Customers
            .Where(c => c.StoreId == storeId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(ct);

    public async Task AddAsync(Customer customer, CancellationToken ct = default)
        => await _context.Customers.AddAsync(customer, ct);

    public void Update(Customer customer)
        => _context.Customers.Update(customer);
}
