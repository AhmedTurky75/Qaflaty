using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;
using Qaflaty.Application.Identity.Services;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;
using Qaflaty.Domain.Identity.Services;

namespace Qaflaty.Application.Identity.Commands.Login;

public class LoginCommandHandler : ICommandHandler<LoginCommand, AuthResponse>
{
    private readonly IMerchantRepository _merchantRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;

    public LoginCommandHandler(
        IMerchantRepository merchantRepository,
        IPasswordHasher passwordHasher,
        ITokenService tokenService)
    {
        _merchantRepository = merchantRepository;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
    }

    public async Task<Result<AuthResponse>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        // Create Email value object
        var emailResult = Email.Create(request.Email);
        if (emailResult.IsFailure)
            return Result.Failure<AuthResponse>(IdentityErrors.InvalidCredentials);

        // Find merchant by email
        var merchant = await _merchantRepository.GetByEmailAsync(emailResult.Value, cancellationToken);
        if (merchant == null)
            return Result.Failure<AuthResponse>(IdentityErrors.InvalidCredentials);

        // Verify password
        var isPasswordValid = _passwordHasher.Verify(request.Password, merchant.PasswordHash);
        if (!isPasswordValid)
            return Result.Failure<AuthResponse>(IdentityErrors.InvalidCredentials);

        // Generate tokens
        var accessToken = _tokenService.GenerateAccessToken(merchant);
        var refreshToken = _tokenService.GenerateRefreshToken();
        var expiresAt = _tokenService.GetAccessTokenExpiration();
        var refreshTokenExpiresAt = _tokenService.GetRefreshTokenExpiration();

        // Add refresh token to merchant
        merchant.AddRefreshToken(refreshToken, refreshTokenExpiresAt);

        _merchantRepository.Update(merchant);

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
