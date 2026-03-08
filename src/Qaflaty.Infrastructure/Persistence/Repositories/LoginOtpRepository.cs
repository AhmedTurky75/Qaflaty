using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Identity.Aggregates.LoginOtp;
using Qaflaty.Domain.Identity.Repositories;
using Qaflaty.Infrastructure.Persistence;

namespace Qaflaty.Infrastructure.Persistence.Repositories;

public class LoginOtpRepository : ILoginOtpRepository
{
    private readonly QaflatyDbContext _context;

    public LoginOtpRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<LoginOtp?> GetLatestForEmailAsync(string email, LoginOtpPurpose purpose, CancellationToken ct = default)
        => await _context.LoginOtps
            .Where(o => o.Email == email && o.Purpose == purpose)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync(ct);

    public async Task AddAsync(LoginOtp otp, CancellationToken ct = default)
        => await _context.LoginOtps.AddAsync(otp, ct);

    public void Update(LoginOtp otp)
        => _context.LoginOtps.Update(otp);
}
