using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;
using Qaflaty.Application.Identity.Services;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.Aggregates.LoginOtp;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;

namespace Qaflaty.Application.Identity.Commands.VerifyCustomerLoginOtp;

public class VerifyCustomerLoginOtpCommandHandler : ICommandHandler<VerifyCustomerLoginOtpCommand, CustomerAuthResponse>
{
    private readonly ILoginOtpRepository _loginOtpRepository;
    private readonly IStoreCustomerRepository _customerRepository;
    private readonly ITokenService _tokenService;

    public VerifyCustomerLoginOtpCommandHandler(
        ILoginOtpRepository loginOtpRepository,
        IStoreCustomerRepository customerRepository,
        ITokenService tokenService)
    {
        _loginOtpRepository = loginOtpRepository;
        _customerRepository = customerRepository;
        _tokenService = tokenService;
    }

    public async Task<Result<CustomerAuthResponse>> Handle(
        VerifyCustomerLoginOtpCommand request,
        CancellationToken cancellationToken)
    {
        // Get latest OTP for this email and purpose
        var otp = await _loginOtpRepository.GetLatestForEmailAsync(
            request.Email, LoginOtpPurpose.CustomerLogin, cancellationToken);

        if (otp == null)
            return Result.Failure<CustomerAuthResponse>(IdentityErrors.OtpNotFound);

        if (otp.IsUsed)
            return Result.Failure<CustomerAuthResponse>(IdentityErrors.OtpAlreadyUsed);

        if (otp.IsExpired())
            return Result.Failure<CustomerAuthResponse>(IdentityErrors.OtpExpired);

        if (otp.IsMaxAttemptsReached())
            return Result.Failure<CustomerAuthResponse>(IdentityErrors.OtpMaxAttemptsReached);

        // Verify code — this increments attempt count internally
        var isValid = otp.Verify(request.OtpCode);
        _loginOtpRepository.Update(otp);

        if (!isValid)
            return Result.Failure<CustomerAuthResponse>(IdentityErrors.OtpInvalid);

        // Get customer by email
        var emailResult = Email.Create(request.Email);
        if (emailResult.IsFailure)
            return Result.Failure<CustomerAuthResponse>(IdentityErrors.CustomerNotFound);

        var customer = await _customerRepository.GetByEmailAsync(emailResult.Value, cancellationToken);
        if (customer == null)
            return Result.Failure<CustomerAuthResponse>(IdentityErrors.CustomerNotFound);

        // Generate tokens
        var accessToken = _tokenService.GenerateCustomerAccessToken(customer);
        var refreshToken = _tokenService.GenerateRefreshToken();
        var expiresAt = _tokenService.GetCustomerAccessTokenExpiration();
        var refreshTokenExpiresAt = _tokenService.GetRefreshTokenExpiration();

        customer.AddRefreshToken(refreshToken, refreshTokenExpiresAt);
        _customerRepository.Update(customer);

        var customerDto = new StoreCustomerDto(
            customer.Id.Value,
            customer.Email.Value,
            customer.FullName.FirstName,
            customer.FullName.LastName,
            customer.FullName.FullName,
            customer.Username,
            customer.Phone?.Value, 
            customer.SecondaryPhone?.Value,
            customer.IsVerified,
            customer.CreatedAt);

        return Result.Success(new CustomerAuthResponse(accessToken, refreshToken, expiresAt, customerDto));
    }
}
