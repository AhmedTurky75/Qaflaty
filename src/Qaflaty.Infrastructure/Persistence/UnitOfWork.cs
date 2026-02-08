using Qaflaty.Application.Common.Interfaces;

namespace Qaflaty.Infrastructure.Persistence;

public class UnitOfWork : IUnitOfWork
{
    private readonly QaflatyDbContext _context;

    public UnitOfWork(QaflatyDbContext context)
    {
        _context = context;
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => _context.SaveChangesAsync(ct);
}
