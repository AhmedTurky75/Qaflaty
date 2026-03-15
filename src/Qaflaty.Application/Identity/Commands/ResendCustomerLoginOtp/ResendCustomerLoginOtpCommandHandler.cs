using Microsoft.Extensions.Configuration;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Identity.Aggregates.LoginOtp;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;

namespace Qaflaty.Application.Identity.Commands.ResendCustomerLoginOtp;

public class ResendCustomerLoginOtpCommandHandler : ICommandHandler<ResendCustomerLoginOtpCommand>
{
    private readonly ILoginOtpRepository _loginOtpRepository;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;

    public ResendCustomerLoginOtpCommandHandler(
        ILoginOtpRepository loginOtpRepository,
        IEmailService emailService,
        IConfiguration configuration)
    {
        _loginOtpRepository = loginOtpRepository;
        _emailService = emailService;
        _configuration = configuration;
    }

    public async Task<Result> Handle(ResendCustomerLoginOtpCommand request, CancellationToken cancellationToken)
    {
        var otp = await _loginOtpRepository.GetLatestForEmailAsync(
            request.Email, LoginOtpPurpose.CustomerLogin, cancellationToken);

        if (otp == null)
            return Result.Failure(IdentityErrors.OtpNotFound);

        if (otp.IsUsed)
            return Result.Failure(IdentityErrors.OtpAlreadyUsed);

        if (!otp.CanResend())
            return Result.Failure(IdentityErrors.OtpResendTooSoon);

        // Invalidate old OTP
        otp.Invalidate();
        _loginOtpRepository.Update(otp);

        // Create new OTP
        var mockCode = _configuration.GetValue<bool>("MockOtp:Enabled")
            ? _configuration.GetValue<string>("MockOtp:Code")
            : null;
        var newOtp = LoginOtp.Create(request.Email, LoginOtpPurpose.CustomerLogin, mockCode);
        await _loginOtpRepository.AddAsync(newOtp, cancellationToken);

        // Send email
        await _emailService.SendEmailAsync(
            request.Email,
            "Your Login Code",
            $"Your new login code is: {newOtp.Code}\n\nThis code expires in {LoginOtp.ExpiryMinutes} minutes.",
            cancellationToken);

        return Result.Success();
    }
}
