using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;
using Qaflaty.Application.Identity.Services;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.Aggregates.LoginOtp;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;

namespace Qaflaty.Application.Identity.Commands.VerifyMerchantLoginOtp;

public class VerifyMerchantLoginOtpCommandHandler : ICommandHandler<VerifyMerchantLoginOtpCommand, AuthResponse>
{
    private readonly ILoginOtpRepository _loginOtpRepository;
    private readonly IMerchantRepository _merchantRepository;
    private readonly ITokenService _tokenService;

    public VerifyMerchantLoginOtpCommandHandler(
        ILoginOtpRepository loginOtpRepository,
        IMerchantRepository merchantRepository,
        ITokenService tokenService)
    {
        _loginOtpRepository = loginOtpRepository;
        _merchantRepository = merchantRepository;
        _tokenService = tokenService;
    }

    public async Task<Result<AuthResponse>> Handle(
        VerifyMerchantLoginOtpCommand request,
        CancellationToken cancellationToken)
    {
        // Get latest OTP for this email and purpose
        var otp = await _loginOtpRepository.GetLatestForEmailAsync(
            request.Email, LoginOtpPurpose.MerchantLogin, cancellationToken);

        if (otp == null)
            return Result.Failure<AuthResponse>(IdentityErrors.OtpNotFound);

        if (otp.IsUsed)
            return Result.Failure<AuthResponse>(IdentityErrors.OtpAlreadyUsed);

        if (otp.IsExpired())
            return Result.Failure<AuthResponse>(IdentityErrors.OtpExpired);

        if (otp.IsMaxAttemptsReached())
            return Result.Failure<AuthResponse>(IdentityErrors.OtpMaxAttemptsReached);

        // Verify code — this increments attempt count internally
        var isValid = otp.Verify(request.OtpCode);
        _loginOtpRepository.Update(otp);

        if (!isValid)
            return Result.Failure<AuthResponse>(IdentityErrors.OtpInvalid);

        // Get merchant by email
        var emailResult = Email.Create(request.Email);
        if (emailResult.IsFailure)
            return Result.Failure<AuthResponse>(IdentityErrors.MerchantNotFound);

        var merchant = await _merchantRepository.GetByEmailAsync(emailResult.Value, cancellationToken);
        if (merchant == null)
            return Result.Failure<AuthResponse>(IdentityErrors.MerchantNotFound);

        // Generate tokens
        var accessToken = _tokenService.GenerateMerchantAccessToken(merchant);
        var refreshToken = _tokenService.GenerateRefreshToken();
        var expiresAt = _tokenService.GetMerchantAccessTokenExpiration();
        var refreshTokenExpiresAt = _tokenService.GetRefreshTokenExpiration();

        merchant.AddRefreshToken(refreshToken, refreshTokenExpiresAt);
        _merchantRepository.Update(merchant);

        var merchantDto = new MerchantDto(
            merchant.Id.Value,
            merchant.Email.Value,
            merchant.FullName.FirstName,
            merchant.FullName.LastName,
            merchant.FullName.FullName,
            merchant.Username,
            merchant.Phone?.Value,
            merchant.IsVerified,
            merchant.CreatedAt);

        return Result.Success(new AuthResponse(accessToken, refreshToken, expiresAt, merchantDto));
    }
}
