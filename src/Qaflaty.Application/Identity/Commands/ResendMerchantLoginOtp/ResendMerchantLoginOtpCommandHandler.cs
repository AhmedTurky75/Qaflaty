using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Identity.Aggregates.LoginOtp;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;

namespace Qaflaty.Application.Identity.Commands.ResendMerchantLoginOtp;

public class ResendMerchantLoginOtpCommandHandler : ICommandHandler<ResendMerchantLoginOtpCommand>
{
    private readonly ILoginOtpRepository _loginOtpRepository;
    private readonly IEmailService _emailService;
    private readonly IOtpSettings _otpSettings;

    public ResendMerchantLoginOtpCommandHandler(
        ILoginOtpRepository loginOtpRepository,
        IEmailService emailService,
        IOtpSettings otpSettings)
    {
        _loginOtpRepository = loginOtpRepository;
        _emailService = emailService;
        _otpSettings = otpSettings;
    }

    public async Task<Result> Handle(ResendMerchantLoginOtpCommand request, CancellationToken cancellationToken)
    {
        var otp = await _loginOtpRepository.GetLatestForEmailAsync(
            request.Email, LoginOtpPurpose.MerchantLogin, cancellationToken);

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
        var newOtp = LoginOtp.Create(request.Email, LoginOtpPurpose.MerchantLogin, _otpSettings.MockCode);
        await _loginOtpRepository.AddAsync(newOtp, cancellationToken);

        // Send email
        await _emailService.SendEmailAsync(
            request.Email,
            "Your Qaflaty Login Code",
            $"Your new login code is: {newOtp.Code}\n\nThis code expires in {LoginOtp.ExpiryMinutes} minutes.",
            cancellationToken);

        return Result.Success();
    }
}
