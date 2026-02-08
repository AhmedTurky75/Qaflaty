using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;
using Qaflaty.Application.Identity.Services;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;

namespace Qaflaty.Application.Identity.Commands.RefreshToken;

public class RefreshTokenCommandHandler : ICommandHandler<RefreshTokenCommand, AuthResponse>
{
    private readonly IMerchantRepository _merchantRepository;
    private readonly ITokenService _tokenService;

    public RefreshTokenCommandHandler(
        IMerchantRepository merchantRepository,
        ITokenService tokenService)
    {
        _merchantRepository = merchantRepository;
        _tokenService = tokenService;
    }

    public async Task<Result<AuthResponse>> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        // Find the refresh token
        var refreshToken = await _merchantRepository.GetRefreshTokenAsync(request.RefreshToken, cancellationToken);
        if (refreshToken == null || !refreshToken.IsActive)
            return Result.Failure<AuthResponse>(IdentityErrors.InvalidRefreshToken);

        // Get the merchant
        var merchant = await _merchantRepository.GetByIdAsync(refreshToken.MerchantId, cancellationToken);
        if (merchant == null)
            return Result.Failure<AuthResponse>(IdentityErrors.MerchantNotFound);

        // Revoke the old refresh token
        merchant.RevokeRefreshToken(request.RefreshToken);

        // Generate new tokens
        var accessToken = _tokenService.GenerateAccessToken(merchant);
        var newRefreshToken = _tokenService.GenerateRefreshToken();
        var expiresAt = _tokenService.GetAccessTokenExpiration();
        var refreshTokenExpiresAt = _tokenService.GetRefreshTokenExpiration();

        // Add new refresh token
        merchant.AddRefreshToken(newRefreshToken, refreshTokenExpiresAt);

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
            newRefreshToken,
            expiresAt,
            merchantDto);

        return Result.Success(response);
    }
}
