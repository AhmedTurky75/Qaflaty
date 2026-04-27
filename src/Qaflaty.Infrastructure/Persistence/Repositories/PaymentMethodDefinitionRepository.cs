using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Catalog.Aggregates.PaymentMethodDefinition;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Infrastructure.Persistence;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class PaymentMethodDefinitionRepository : IPaymentMethodDefinitionRepository
{
    private readonly QaflatyDbContext _context;

    public PaymentMethodDefinitionRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<List<PaymentMethodDefinition>> GetAllActiveAsync(CancellationToken cancellationToken)
    {
        return await _context.PaymentMethodDefinitions
            .Where(d => d.IsActive)
            .OrderBy(d => d.SortOrder)
            .ToListAsync(cancellationToken);
    }
}
