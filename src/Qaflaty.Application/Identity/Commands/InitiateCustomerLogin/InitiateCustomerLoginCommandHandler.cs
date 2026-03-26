using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Identity.DTOs;
using Qaflaty.Application.Identity.Services;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.Aggregates.LoginOtp;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;
using Qaflaty.Domain.Identity.Services;

namespace Qaflaty.Application.Identity.Commands.InitiateCustomerLogin;

public class InitiateCustomerLoginCommandHandler : ICommandHandler<InitiateCustomerLoginCommand, InitiateCustomerLoginResponse>
{
    private readonly IStoreCustomerRepository _customerRepository;
    private readonly ILoginOtpRepository _loginOtpRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailService _emailService;
    private readonly IOtpSettings _otpSettings;
    private readonly IStoreConfigurationRepository _storeConfigRepository;
    private readonly ITenantContext _tenantContext;
    private readonly ITokenService _tokenService;

    public InitiateCustomerLoginCommandHandler(
        IStoreCustomerRepository customerRepository,
        ILoginOtpRepository loginOtpRepository,
        IPasswordHasher passwordHasher,
        IEmailService emailService,
        IOtpSettings otpSettings,
        IStoreConfigurationRepository storeConfigRepository,
        ITenantContext tenantContext,
        ITokenService tokenService)
    {
        _customerRepository = customerRepository;
        _loginOtpRepository = loginOtpRepository;
        _passwordHasher = passwordHasher;
        _emailService = emailService;
        _otpSettings = otpSettings;
        _storeConfigRepository = storeConfigRepository;
        _tenantContext = tenantContext;
        _tokenService = tokenService;
    }

    public async Task<Result<InitiateCustomerLoginResponse>> Handle(
        InitiateCustomerLoginCommand request,
        CancellationToken cancellationToken)
    {
        // Try to find customer by email or username
        Domain.Identity.Aggregates.StoreCustomer.StoreCustomer? customer = null;

        var emailResult = Email.Create(request.EmailOrUsername);
        if (emailResult.IsSuccess)
        {
            customer = await _customerRepository.GetByEmailAsync(emailResult.Value, cancellationToken);
        }
        else
        {
            customer = await _customerRepository.GetByUsernameAsync(request.EmailOrUsername, cancellationToken);
        }

        if (customer == null)
            return Result.Failure<InitiateCustomerLoginResponse>(IdentityErrors.InvalidCredentials);

        // Verify password
        var isPasswordValid = _passwordHasher.Verify(request.Password, customer.PasswordHash);
        if (!isPasswordValid)
            return Result.Failure<InitiateCustomerLoginResponse>(IdentityErrors.InvalidCredentials);

        // Check if email verification (OTP) is required for this store
        var storeId = _tenantContext.CurrentStoreId;
        if (storeId != null)
        {
            var config = await _storeConfigRepository.GetByStoreIdAsync(storeId.Value, cancellationToken);
            if (config?.CustomerAuthSettings.RequireEmailVerification == false)
            {
                // Direct login — skip OTP
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
                    customer.CreatedAt,
                    customer.Addresses.Select(a => new CustomerAddressDto(
                        a.Label,
                        a.Street,
                        a.City,
                        a.State,
                        a.PostalCode,
                        a.Country,
                        a.IsDefault,
                        a.Latitude,
                        a.Longitude)).ToList());

                var authResponse = new CustomerAuthResponse(accessToken, refreshToken, expiresAt, customerDto);
                return Result.Success(new InitiateCustomerLoginResponse(false, customer.Email.Value, authResponse));
            }
        }

        // OTP flow — invalidate any existing unused OTPs for this email
        var existingOtp = await _loginOtpRepository.GetLatestForEmailAsync(
            customer.Email.Value, LoginOtpPurpose.CustomerLogin, cancellationToken);

        if (existingOtp != null && !existingOtp.IsUsed)
        {
            existingOtp.Invalidate();
            _loginOtpRepository.Update(existingOtp);
        }

        // Generate new LoginOtp
        var otp = LoginOtp.Create(customer.Email.Value, LoginOtpPurpose.CustomerLogin, _otpSettings.MockCode);
        await _loginOtpRepository.AddAsync(otp, cancellationToken);

        // Send email with the code
        await _emailService.SendEmailAsync(
            customer.Email.Value,
            "Your Login Code",
            $"Your login code is: {otp.Code}\n\nThis code expires in {LoginOtp.ExpiryMinutes} minutes.",
            cancellationToken);

        return Result.Success(new InitiateCustomerLoginResponse(true, customer.Email.Value));
    }
}
