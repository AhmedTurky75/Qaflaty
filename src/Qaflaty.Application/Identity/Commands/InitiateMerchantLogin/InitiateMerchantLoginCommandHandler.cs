using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.Aggregates.LoginOtp;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;
using Qaflaty.Domain.Identity.Services;

namespace Qaflaty.Application.Identity.Commands.InitiateMerchantLogin;

public class InitiateMerchantLoginCommandHandler : ICommandHandler<InitiateMerchantLoginCommand, InitiateLoginResponse>
{
    private readonly IMerchantRepository _merchantRepository;
    private readonly ILoginOtpRepository _loginOtpRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailService _emailService;

    public InitiateMerchantLoginCommandHandler(
        IMerchantRepository merchantRepository,
        ILoginOtpRepository loginOtpRepository,
        IPasswordHasher passwordHasher,
        IEmailService emailService)
    {
        _merchantRepository = merchantRepository;
        _loginOtpRepository = loginOtpRepository;
        _passwordHasher = passwordHasher;
        _emailService = emailService;
    }

    public async Task<Result<InitiateLoginResponse>> Handle(
        InitiateMerchantLoginCommand request,
        CancellationToken cancellationToken)
    {
        // Try to find merchant by email or username
        Domain.Identity.Aggregates.Merchant.Merchant? merchant = null;

        var emailResult = Email.Create(request.EmailOrUsername);
        if (emailResult.IsSuccess)
        {
            merchant = await _merchantRepository.GetByEmailAsync(emailResult.Value, cancellationToken);
        }
        else
        {
            merchant = await _merchantRepository.GetByUsernameAsync(request.EmailOrUsername, cancellationToken);
        }

        if (merchant == null)
            return Result.Failure<InitiateLoginResponse>(IdentityErrors.InvalidCredentials);

        // Verify password
        var isPasswordValid = _passwordHasher.Verify(request.Password, merchant.PasswordHash);
        if (!isPasswordValid)
            return Result.Failure<InitiateLoginResponse>(IdentityErrors.InvalidCredentials);

        // Invalidate any existing unused OTPs for this email
        var existingOtp = await _loginOtpRepository.GetLatestForEmailAsync(
            merchant.Email.Value, LoginOtpPurpose.MerchantLogin, cancellationToken);

        if (existingOtp != null && !existingOtp.IsUsed)
        {
            existingOtp.Invalidate();
            _loginOtpRepository.Update(existingOtp);
        }

        // Generate new LoginOtp
        var otp = LoginOtp.Create(merchant.Email.Value, LoginOtpPurpose.MerchantLogin);
        await _loginOtpRepository.AddAsync(otp, cancellationToken);

        // Send email with the code
        await _emailService.SendEmailAsync(
            merchant.Email.Value,
            "Your Qaflaty Login Code",
            $"Your login code is: {otp.Code}\n\nThis code expires in {LoginOtp.ExpiryMinutes} minutes.",
            cancellationToken);

        return Result.Success(new InitiateLoginResponse(merchant.Email.Value));
    }
}
