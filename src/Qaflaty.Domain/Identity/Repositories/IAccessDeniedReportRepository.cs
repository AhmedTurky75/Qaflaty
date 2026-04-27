using Qaflaty.Domain.Identity.Aggregates.AccessDeniedReport;

namespace Qaflaty.Domain.Identity.Repositories;

public interface IAccessDeniedReportRepository
{
    Task AddAsync(AccessDeniedReport report, CancellationToken cancellationToken);
}
