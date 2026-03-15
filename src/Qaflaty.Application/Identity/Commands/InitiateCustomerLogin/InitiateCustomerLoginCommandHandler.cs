using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Identity.Commands.InitiateMerchantLogin;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.Aggregates.LoginOtp;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;
using Qaflaty.Domain.Identity.Services;

namespace Qaflaty.Application.Identity.Commands.InitiateCustomerLogin;

public class InitiateCustomerLoginCommandHandler : ICommandHandler<InitiateCustomerLoginCommand, InitiateLoginResponse>
{
    private readonly IStoreCustomerRepository _customerRepository;
    private readonly ILoginOtpRepository _loginOtpRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailService _emailService;
    private readonly IOtpSettings _otpSettings;

    public InitiateCustomerLoginCommandHandler(
        IStoreCustomerRepository customerRepository,
        ILoginOtpRepository loginOtpRepository,
        IPasswordHasher passwordHasher,
        IEmailService emailService,
        IOtpSettings otpSettings)
    {
        _customerRepository = customerRepository;
        _loginOtpRepository = loginOtpRepository;
        _passwordHasher = passwordHasher;
        _emailService = emailService;
        _otpSettings = otpSettings;
    }

    public async Task<Result<InitiateLoginResponse>> Handle(
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
            return Result.Failure<InitiateLoginResponse>(IdentityErrors.InvalidCredentials);

        // Verify password
        var isPasswordValid = _passwordHasher.Verify(request.Password, customer.PasswordHash);
        if (!isPasswordValid)
            return Result.Failure<InitiateLoginResponse>(IdentityErrors.InvalidCredentials);

        // Invalidate any existing unused OTPs for this email
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

        return Result.Success(new InitiateLoginResponse(customer.Email.Value));
    }
}
