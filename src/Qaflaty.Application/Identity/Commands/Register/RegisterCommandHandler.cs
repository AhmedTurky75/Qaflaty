using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;
using Qaflaty.Application.Identity.Services;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.Aggregates.Merchant;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;
using Qaflaty.Domain.Identity.Services;
using Qaflaty.Domain.Identity.ValueObjects;

namespace Qaflaty.Application.Identity.Commands.Register;

public class RegisterCommandHandler : ICommandHandler<RegisterCommand, AuthResponse>
{
    private readonly IMerchantRepository _merchantRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;

    public RegisterCommandHandler(
        IMerchantRepository merchantRepository,
        IPasswordHasher passwordHasher,
        ITokenService tokenService)
    {
        _merchantRepository = merchantRepository;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
    }

    public async Task<Result<AuthResponse>> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        // Create Email value object
        var emailResult = Email.Create(request.Email);
        if (emailResult.IsFailure)
            return Result.Failure<AuthResponse>(emailResult.Error);

        // Check if email already exists
        var emailExists = await _merchantRepository.ExistsByEmailAsync(emailResult.Value, cancellationToken);
        if (emailExists)
            return Result.Failure<AuthResponse>(IdentityErrors.EmailAlreadyExists);

        // Create PersonName value object
        var nameResult = PersonName.Create(request.FullName);
        if (nameResult.IsFailure)
            return Result.Failure<AuthResponse>(nameResult.Error);

        // Create PhoneNumber value object if provided
        PhoneNumber? phone = null;
        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            var phoneResult = PhoneNumber.Create(request.Phone);
            if (phoneResult.IsFailure)
                return Result.Failure<AuthResponse>(phoneResult.Error);
            phone = phoneResult.Value;
        }

        // Hash password
        var hashedPassword = _passwordHasher.Hash(request.Password);

        // Create Merchant aggregate
        var merchantResult = Merchant.Create(
            emailResult.Value,
            hashedPassword,
            nameResult.Value,
            phone);

        if (merchantResult.IsFailure)
            return Result.Failure<AuthResponse>(merchantResult.Error);

        var merchant = merchantResult.Value;

        // Generate tokens
        var accessToken = _tokenService.GenerateAccessToken(merchant);
        var refreshToken = _tokenService.GenerateRefreshToken();
        var expiresAt = _tokenService.GetAccessTokenExpiration();
        var refreshTokenExpiresAt = _tokenService.GetRefreshTokenExpiration();

        // Add refresh token to merchant
        merchant.AddRefreshToken(refreshToken, refreshTokenExpiresAt);

        // Save merchant
        await _merchantRepository.AddAsync(merchant, cancellationToken);

        // Map to DTO
        var merchantDto = new MerchantDto(
            merchant.Id.Value,
            merchant.Email.Value,
            merchant.FullName.Value,
            merchant.Phone?.Value,
            merchant.IsVerified,
            merchant.CreatedAt);

        var response = new AuthResponse(
            accessToken,
            refreshToken,
            expiresAt,
            merchantDto);

        return Result.Success(response);
    }
}
