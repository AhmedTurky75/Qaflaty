using Qaflaty.Domain.Identity.Aggregates.AccessDeniedReport;
using Qaflaty.Domain.Identity.Repositories;
using Qaflaty.Infrastructure.Persistence;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class AccessDeniedReportRepository : IAccessDeniedReportRepository
{
    private readonly QaflatyDbContext _context;

    public AccessDeniedReportRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(AccessDeniedReport report, CancellationToken cancellationToken)
    {
        await _context.AccessDeniedReports.AddAsync(report, cancellationToken);
    }
}
