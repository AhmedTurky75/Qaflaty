using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;
using Qaflaty.Domain.Identity.Services;

namespace Qaflaty.Application.Identity.Commands.ChangePassword;

public class ChangePasswordCommandHandler : ICommandHandler<ChangePasswordCommand>
{
    private readonly IMerchantRepository _merchantRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IPasswordHasher _passwordHasher;

    public ChangePasswordCommandHandler(
        IMerchantRepository merchantRepository,
        ICurrentUserService currentUserService,
        IPasswordHasher passwordHasher)
    {
        _merchantRepository = merchantRepository;
        _currentUserService = currentUserService;
        _passwordHasher = passwordHasher;
    }

    public async Task<Result> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.MerchantId == null)
            return Result.Failure(IdentityErrors.MerchantNotFound);

        // Get current merchant
        var merchant = await _merchantRepository.GetByIdAsync(_currentUserService.MerchantId.Value, cancellationToken);
        if (merchant == null)
            return Result.Failure(IdentityErrors.MerchantNotFound);

        // Verify current password
        var isCurrentPasswordValid = _passwordHasher.Verify(request.CurrentPassword, merchant.PasswordHash);
        if (!isCurrentPasswordValid)
            return Result.Failure(IdentityErrors.InvalidCredentials);

        // Hash new password
        var newHashedPassword = _passwordHasher.Hash(request.NewPassword);

        // Change password
        var result = merchant.ChangePassword(newHashedPassword);
        if (result.IsFailure)
            return result;

        // Revoke all refresh tokens for security
        merchant.RevokeAllRefreshTokens();

        _merchantRepository.Update(merchant);

        return Result.Success();
    }
}
