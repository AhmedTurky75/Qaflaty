using Qaflaty.Domain.Identity.Aggregates.LoginOtp;

namespace Qaflaty.Domain.Identity.Repositories;

public interface ILoginOtpRepository
{
    Task<LoginOtp?> GetLatestForEmailAsync(string email, LoginOtpPurpose purpose, CancellationToken ct = default);
    Task AddAsync(LoginOtp otp, CancellationToken ct = default);
    void Update(LoginOtp otp);
}
